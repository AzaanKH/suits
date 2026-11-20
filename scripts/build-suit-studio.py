"""Prepare artist-authored CC0 tailoring for the interactive studio.
Run with Blender --background --python scripts/build-suit-studio.py.
Source: Margaret Toigo, MakeHuman Suits 01, CC0. See assets/suit-studio/README.md.
"""
import bpy, bmesh, math, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets/suit-studio/source'
OUT=ROOT/'assets/suit-studio'
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)

def mat(name,color,rough=.8):
 m=bpy.data.materials.get(name) or bpy.data.materials.new(name);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough
 return m
MATS={k:mat(k,c,r) for k,c,r in [('Cloth',(.032,.052,.089),.8),('Lapel',(.032,.052,.089),.8),('Trouser',(.032,.052,.089),.8),('Shirt',(.88,.9,.91),.82),('Button',(.035,.024,.017),.34),('Lining',(.025,.033,.049),.48),('Waistcoat',(.032,.052,.089),.8)]}

def uv_islands(obj):
 bm=bmesh.new();bm.from_mesh(obj.data);uv=bm.loops.layers.uv.active;bm.faces.ensure_lookup_table();visited=set();out=[]
 for f in bm.faces:
  if f.index in visited:continue
  stack=[f];faces=[];visited.add(f.index)
  while stack:
   a=stack.pop();faces.append(a.index)
   for e in a.edges:
    for b in e.link_faces:
     if b.index in visited:continue
     ua={l.vert.index:tuple(l[uv].uv) for l in a.loops if l.vert in e.verts};ub={l.vert.index:tuple(l[uv].uv) for l in b.loops if l.vert in e.verts}
     if ua==ub:stack.append(b);visited.add(b.index)
  out.append(faces)
 bm.free();return out

def smooth(t):
 t=max(0,min(1,t));return t*t*(3-2*t)

ARM_CENTERS=[0]*11

def pose(x,y,z,arm=False,trouser=False):
 sign=1 if x>=0 else -1
 if arm:
  # Relax the original A-pose around the shoulder, with a blended sleeve cap.
  t=max(0,min(1,((abs(x)-1.85)*3+(6-y)*3.4)/20.56))
  sample=t*10;lo=min(9,int(sample));fraction=sample-lo
  center=ARM_CENTERS[lo]*(1-fraction)+ARM_CENTERS[lo+1]*fraction
  weight=smooth((abs(x)-1.65)/1.15)
  angle=-sign*math.radians(33)*weight
  dx=x-sign*1.85;dy=y-6.0
  x=sign*1.85+dx*math.cos(angle)-dy*math.sin(angle)
  y=6.0+dx*math.sin(angle)+dy*math.cos(angle)-.85*weight
  z+=(.05+.65*t-center)*weight
 elif trouser:
  # Bring the legs under the hips while retaining the authored crotch and crease.
  x*=1-.36*smooth((1-y)/8)
  x*=.94
 else:
  waist=math.exp(-((y-2.5)/1.7)**2)
  x*=1.06-.055*waist-.12*smooth((2-y)/2)
 # MakeHuman uses decimeters, Y up; Blender uses Z up.
 return (x*.1,-z*.1,(y+7.5644)*.1+.035)

def finish(obj,name,material,sub=2):
 obj.name=name;obj.data.materials.clear();obj.data.materials.append(MATS[material])
 for p in obj.data.polygons:p.material_index=0;p.use_smooth=True
 if sub:
  bpy.context.view_layer.objects.active=obj
  mod=obj.modifiers.new('Tailored subdivision','SUBSURF');mod.levels=sub;bpy.ops.object.modifier_apply(modifier=mod.name)
 return obj

def duplicate(obj,name):
 n=obj.copy();n.data=obj.data.copy();n.name=name;bpy.context.collection.objects.link(n);return n

def load(kind):
 global ARM_CENTERS
 file=SOURCE/({'single':'suit3.obj','double':'double/suit_double_breasted.obj','dinner':'dinner/suit_dinner_jacket.obj'}[kind])
 bpy.ops.wm.obj_import(filepath=str(file), forward_axis='NEGATIVE_Z',up_axis='Y')
 o=bpy.context.object;bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.separate(type='LOOSE');bpy.ops.object.mode_set(mode='OBJECT')
 pieces=list(bpy.context.selected_objects)
 idx={'single':8,'double':11,'dinner':15}[kind];jacket=pieces[idx];islands=uv_islands(jacket)
 labels={}
 if kind=='single':
  for i in (3,10):labels[i]='lapel'
  for i in (0,11):labels[i]='collar'
  for i in (6,9):labels[i]='pocket'
  for i in (4,13):labels[i]='breast'
  labels[15]='buttonhole'
  sleeves=(12,14)
 elif kind=='double':
  for i in (2,4):labels[i]='lapel'
  labels[3]='collar';sleeves=(6,7)
 else:
  for i in (6,10):labels[i]='lapel'
  for i in (7,11):labels[i]='pocket'
  for i in (3,13):labels[i]='cuff'
  for i in (4,5):labels[i]='breast'
  sleeves=(2,3,12,13)
 front_verts={v for i in ((2,8) if kind=='single' else (0,5)) for f in islands[i] for v in jacket.data.polygons[f].vertices}
 sleeve_verts={v for i in sleeves for f in islands[i] for v in jacket.data.polygons[f].vertices}
 bins=[[] for _ in range(11)]
 for index in sleeve_verts:
  x,y,z=jacket.data.vertices[index].co
  t=max(0,min(1,((abs(x)-1.85)*3+(6-y)*3.4)/20.56))
  bins[round(t*10)].append(z)
 ARM_CENTERS=[(min(b)+max(b))/2 if b else 0 for b in bins]
 jacket.data.materials.clear()
 names=['body','lapel','collar','pocket','breast','buttonhole','cuff']
 for name in names:jacket.data.materials.append(mat('split_'+name,(.035,.05,.08)))
 for i,faces in enumerate(islands):
  for f in faces:jacket.data.polygons[f].material_index=names.index(labels.get(i,'body'))
 for i,o in enumerate(pieces):
  o.rotation_euler=(0,0,0);o.location=(0,0,0);o.scale=(1,1,1)
  if i==idx:
   for v in o.data.vertices:
    x,y,z=v.co
    # More open front quarters below the fastening point.
    if kind=='single' and v.index in front_verts and z>.55 and abs(x)<1.0 and y<2:
     mask=math.exp(-(x/.55)**2)
     x+=(1 if x>-.06 else -1)*.4*smooth((2-y)/2)*mask
     y+=.16*smooth((1.4-y)/1.4)*mask
    v.co=pose(x,y,z,v.index in sleeve_verts)
   for p in o.data.polygons:p.use_smooth=True
   bpy.context.view_layer.objects.active=o
   sub=o.modifiers.new('Continuous garment surface','SUBSURF');sub.levels=2;bpy.ops.object.modifier_apply(modifier=sub.name)
   bpy.ops.object.select_all(action='DESELECT');o.select_set(True)
   bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.separate(type='MATERIAL');bpy.ops.object.mode_set(mode='OBJECT')
   for part in list(bpy.context.selected_objects):
    key=part.data.materials[0].name.replace('split_','')
    name=f'{kind}_{key}'
    finish(part,name,'Lapel' if key in ['lapel','collar'] else 'Shirt' if key=='cuff' else 'Cloth',0)
  elif kind=='single' and i==12:
   for v in o.data.vertices:v.co=pose(*v.co,trouser=True)
   finish(o,'trousers','Trouser')
  elif (kind=='single' and i in (7,13,14)) or (kind=='double' and i in (13,14,15,16)) or (kind=='dinner' and i in (11,12)):
   is_cuff = i in ((13,14) if kind=='single' else (15,16) if kind=='double' else ())
   for v in o.data.vertices:v.co=pose(*v.co,arm=is_cuff)
   finish(o,f'{kind}_cuff_{i}' if is_cuff else f'{kind}_shirt_{i}','Shirt')
  elif len(o.data.vertices)==65 or (kind=='dinner' and (i<8 or i==14)):
   for v in o.data.vertices:v.co=pose(*v.co,arm=abs(v.co.x)>3)
   name=f'{kind}_button_{i}'
   finish(o,name,'Button',1)
   if (kind=='single' and i in (10,11)) or (kind=='double' and i in (7,8,9,10)) or (kind=='dinner' and i==14):
    for v in o.data.vertices:v.co.y-=.007
   # Two-button default; the upper authored third fastening is removed.
   if kind=='single' and i==9:bpy.data.objects.remove(o,do_unlink=True)
  else:bpy.data.objects.remove(o,do_unlink=True)
 # Independent lapel shape variants keep the same inner roll and seam.
 lapel=bpy.data.objects.get(f'{kind}_lapel')
 if lapel and kind=='dinner':lapel.name='dinner_lapel_shawl'
 if lapel and kind!='dinner':
  lapel.name=f'{kind}_lapel_notch'
  peak=duplicate(lapel,f'{kind}_lapel_peak')
  for v in peak.data.vertices:
   x,y,z=v.co;w=smooth((abs(x)-.08)/.045)*math.exp(-((z-1.44)/.038)**2) if kind=='single' else 0
   v.co.x+=math.copysign(.018*w,x);v.co.z+=.018*w
  shawl=duplicate(lapel,f'{kind}_lapel_shawl')
  # A denser smoothed roll softens the gorge into a continuous shawl edge.
  for v in shawl.data.vertices:
   x,y,z=v.co;v.co.x*=1.1;v.co.y-=.002
  bpy.context.view_layer.objects.active=shawl
  sm=shawl.modifiers.new('Soft shawl roll','SMOOTH');sm.factor=1.35;sm.iterations=22;bpy.ops.object.modifier_apply(modifier=sm.name)
 # Pocket options retain original attachment geometry.
 pocket=bpy.data.objects.get(f'{kind}_pocket')
 if pocket:
  pocket.name=f'{kind}_pocket_flap'
  slanted=duplicate(pocket,f'{kind}_pocket_slanted')
  for v in slanted.data.vertices:v.co.z+=(abs(v.co.x)-.09)*.28
  welt=duplicate(pocket,f'{kind}_pocket_welt')
  patch=duplicate(pocket,f'{kind}_pocket_patch')
  for v in welt.data.vertices:v.co.z=.994+(v.co.z-.994)*.18
  for v in patch.data.vertices:v.co.z=.994+(v.co.z-.994)*2.2
 # Only the single suit contributes trousers and shirt. Shared pieces fit both.

load('single');load('double');load('dinner')
# Pockets for the double-breasted block use the tailored single flaps, rescaled.
for option in ['flap','welt','patch','slanted']:
 p=duplicate(bpy.data.objects[f'single_pocket_{option}'],f'double_pocket_{option}')
 for v in p.data.vertices:v.co.y+=.016;v.co.z+=.055
# The authored four-button DB gets a third matched row for the six-button option.
for key in [9,10]:
 o=duplicate(bpy.data.objects[f'double_button_{key}'],f'double_button_upper_{key}')
 for v in o.data.vertices:v.co.z+=.10
# Fit the visible waistcoat to the authored shirt surface, inside the jacket.
# Clip the shirt front below a V neckline; the closed jacket conceals the lower vest.
shirt=bpy.data.objects['single_shirt_7']
verts=[];faces=[];uvs=[]
def clip_polygon(poly, distance):
 result=[]
 for i,current in enumerate(poly):
  previous=poly[i-1];dc=distance(current[0]);dp=distance(previous[0])
  if (dc>=0)!=(dp>=0):
   t=dp/(dp-dc);result.append((previous[0].lerp(current[0],t),previous[1].lerp(current[1],t)))
  if dc>=0:result.append(current)
 return result
for face in shirt.data.polygons:
 if sum(shirt.data.vertices[i].co.y for i in face.vertices)/len(face.vertices)>-.06:continue
 for side in [-1,1]:
  poly=[(shirt.data.vertices[shirt.data.loops[i].vertex_index].co.copy(),shirt.data.uv_layers.active.data[i].uv.copy()) for i in face.loop_indices]
  poly=clip_polygon(poly,lambda v:side*v.x)
  poly=clip_polygon(poly,lambda v:1.30+side*v.x*1.45-v.z)
  if len(poly)<3:continue
  start=len(verts);faces.append(tuple(range(start,start+len(poly))))
  for co,uv in poly:co.y-=.002;verts.append(tuple(co));uvs.append(tuple(uv))
mesh=bpy.data.meshes.new('Waistcoat fitted insert');mesh.from_pydata(verts,[],faces);mesh.update()
uvlayer=mesh.uv_layers.new(name='UVMap')
for loop in mesh.loops:uvlayer.data[loop.index].uv=uvs[loop.vertex_index]
o=bpy.data.objects.new('waistcoat',mesh);bpy.context.collection.objects.link(o);finish(o,'waistcoat','Waistcoat',0)
sol=o.modifiers.new('Cloth thickness','SOLIDIFY');sol.thickness=.001
for i in range(3):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=.003,location=(0,-.17,1.38-i*.045));o=bpy.context.object;o.scale.y=.4;finish(o,f'shirt_button_{i}','Shirt',0)
# Center seam and discrete vest buttons.
for i in range(5):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=.0035,location=(.002,-.158,1.28-i*.045));o=bpy.context.object;o.scale.y=.38;finish(o,f'vest_button_{i}','Button',0)
# Plain front / pleats are separate geometry, hidden until requested.
for side in [-1,1]:
 for number in [0,1]:
  curve=bpy.data.curves.new('Pressed pleat','CURVE');curve.dimensions='3D';curve.bevel_depth=.0014;curve.bevel_resolution=3
  sp=curve.splines.new('BEZIER');sp.bezier_points.add(2)
  for b,co in zip(sp.bezier_points,[(side*(.083+number*.035),-.119,.96),(side*(.087+number*.033),-.143,.85),(side*(.097+number*.03),-.15,.70)]):b.co=co;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
  obj=bpy.data.objects.new(f'pleat_{side}_{number}',curve);bpy.context.collection.objects.link(obj);obj.data.materials.append(MATS['Trouser'])
# Independent waistband treatments, mostly concealed by the jacket in full view.
for i,angle in enumerate([-.95,-.45,.45,.95,math.pi]):
 x=.186*math.sin(angle);y=-.126*math.cos(angle)
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,.95));o=bpy.context.object;o.dimensions=(.008,.004,.045);o.rotation_euler.z=-angle
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 mod=o.modifiers.new('Folded loop edge','BEVEL');mod.width=.002;mod.segments=3
 finish(o,f'waist_loop_{i}','Trouser',0)
for sign in [-1,1]:
 bpy.ops.mesh.primitive_cube_add(size=1,location=(sign*.183,-.029,.947));o=bpy.context.object;o.dimensions=(.004,.052,.012)
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 mod=o.modifiers.new('Turned tab edge','BEVEL');mod.width=.002;mod.segments=3
 finish(o,f'waist_adjuster_{sign}','Trouser',0)
# Export geometry with named material regions and separate variants.
bpy.ops.object.select_all(action='SELECT')
for o in list(bpy.context.selected_objects):
 if o.type=='CURVE':bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
model_objects=list(bpy.context.scene.objects)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/suit-studio/arden-studio.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'arden-tailoring.glb'),export_format='GLB',export_apply=True,export_cameras=False,export_lights=False)
manifest={o.name:{'vertices':len(o.data.vertices),'triangles':sum(len(p.vertices)-2 for p in o.data.polygons)} for o in model_objects if o.type=='MESH'}
(OUT/'parts.json').write_text(json.dumps(manifest,indent=2))
# Preview a front-three-quarter view of the default assembly for visual QA.
for o in model_objects:
 o.hide_render=o.name.startswith(('double_','dinner_')) or any(k in o.name for k in ['_peak','_shawl','_welt','_patch','_slanted','waistcoat','vest_button','pleat_','waist_'])
center=Vector((0,0,.8))
bpy.ops.object.camera_add(location=(.32,-3.7,1.0));cam=bpy.context.object;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=1.8;bpy.context.scene.camera=cam
for pos,power,size in [((-3,-4,5),550,4),((3,-1,3),250,3),((0,3,4),700,3)]:
 bpy.ops.object.light_add(type='AREA',location=pos);l=bpy.context.object;l.data.energy=power;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(center-l.location).to_track_quat('-Z','Y').to_euler()
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=32;s.cycles.use_denoising=True;s.world.color=(.5,.5,.5);s.render.resolution_x=900;s.render.resolution_y=1100;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.filepath=str(ROOT/'assets/suit-studio/model-review.png');s.view_settings.view_transform='AgX';bpy.ops.render.render(write_still=True)
print('Studio asset complete',manifest)
