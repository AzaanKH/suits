"""Prepare artist-authored CC0 tailoring for the interactive studio.
Run with Blender --background --python scripts/build-suit-studio.py.
Source: Margaret Toigo, MakeHuman Suits 01, CC0. See assets/suit-studio/README.md.
"""
import bpy, bmesh, math, json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
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

def solve3(M,b):
 # Least-squares normal equations for a 3-term affine fit.
 M=[m[:]+[b[i]] for i,m in enumerate(M)]
 for c in range(3):
  p=max(range(c,3),key=lambda r:abs(M[r][c]));M[c],M[p]=M[p],M[c]
  for r in range(3):
   if r!=c:
    k=M[r][c]/M[c][c];M[r]=[a-k*b for a,b in zip(M[r],M[c])]
 return [M[i][3]/M[i][i] for i in range(3)]
def solve(M,b):
 # Gaussian elimination with partial pivoting for small normal equations.
 n=len(b);M=[m[:]+[b[i]] for i,m in enumerate(M)]
 for c in range(n):
  p=max(range(c,n),key=lambda r:abs(M[r][c]));M[c],M[p]=M[p],M[c]
  for r in range(n):
   if r!=c:
    k=M[r][c]/M[c][c];M[r]=[a-k*b for a,b in zip(M[r],M[c])]
 return [M[i][n]/M[i][i] for i in range(n)]
def fit_quadratic(points):
 # Least-squares y = f(x, z) over (1, x, z, x², xz, z²).
 terms=lambda x,z:(1.0,x,z,x*x,x*z,z*z)
 N=[[0.0]*6 for _ in range(6)];rhs=[0.0]*6
 for q in points:
  t=terms(q.x,q.z)
  for i in range(6):
   rhs[i]+=t[i]*q.y
   for j in range(6):N[i][j]+=t[i]*t[j]
 k=solve(N,rhs);return lambda x,z:sum(a*b for a,b in zip(k,terms(x,z)))
def affine_uv(loops,uv):
 # uv ≈ affine(x, z), fitted to the given loops.
 A=[[0.0]*3 for _ in range(3)];bu=[0.0]*3;bv=[0.0]*3
 for l in loops:
  row=(l.vert.co.x,l.vert.co.z,1.0);u=l[uv].uv
  for i in range(3):
   bu[i]+=row[i]*u.x;bv[i]+=row[i]*u.y
   for j in range(3):A[i][j]+=row[i]*row[j]
 cu,cv=solve(A,bu),solve(A,bv)
 return lambda x,z:Vector((cu[0]*x+cu[1]*z+cu[2],cv[0]*x+cv[1]*z+cv[2]))
def keep_pocket_cloth(obj,names):
 # The source cuts each hip-pocket flap (and its bag) out of the body, so
 # there is no cloth under it and every style but the straight flap shows a
 # hole. Copy the pocket faces out as the flap, then fill the body's hole on
 # the low-poly mesh and lay the fill on a surface fitted to the cloth around
 # it, so subdivision smooths fill and rim together.
 pid=names.index('pocket');bid=names.index('body')
 bm=bmesh.new();bm.from_mesh(obj.data);bm.normal_update();uv=bm.loops.layers.uv.active
 pf=[f for f in bm.faces if f.material_index==pid]
 if not pf:bm.free();return
 # The copy keeps the pocket material: it becomes the flap. Its open edges
 # must not be mistaken for the body's hole.
 copied=set(bmesh.ops.duplicate(bm,geom=pf)['geom'])
 pset=set(pf)
 # The edges each pocket shared with the body: after deletion, exactly the
 # hole's rim. (Searching for boundary edges near the pocket also picks up the
 # jacket's own front edge and hem, and moving those deforms the jacket.)
 shared={e for f in pf for e in f.edges if any(g not in pset and g.material_index==bid for g in e.link_faces)}
 regions=[]
 for side in (-1,1):
  sv=[v for f in pf if f.calc_center_median().x*side>0 for v in f.verts]
  xs=[v.co.x for v in sv];zs=[v.co.z for v in sv]
  regions.append((side,min(xs)-.06,max(xs)+.06,min(zs)-.06,max(zs)+.06))
 bmesh.ops.delete(bm,geom=pf,context='FACES')
 bm.normal_update()
 for side,x0,x1,z0,z1 in regions:
  inside=lambda co:x0<co.x<x1 and z0<co.z<z1
  near=[f for f in bm.faces if f.material_index==bid and f.normal.y<-.3 and inside(f.calc_center_median())]
  rim=[e for e in shared if e.is_valid and e.is_boundary and (e.verts[0].co.x+e.verts[1].co.x)*side>0]
  if not rim:continue
  rv={v for e in rim for v in e.verts}
  # Fit only to clean cloth 25 mm or more outside the old opening, then lay
  # the rim on that surface and feather the rows around it into it: the slot
  # had left both a raised edge and a recess that printed through pockets.
  bx0,bx1=min(v.co.x for v in rv),max(v.co.x for v in rv)
  bz0,bz1=min(v.co.z for v in rv),max(v.co.z for v in rv)
  distance=lambda p:max(bx0-p.x,p.x-bx1,bz0-p.z,p.z-bz1,0)
  loops=[l for f in near for l in f.loops if distance(l.vert.co)>.025]
  surface=fit_quadratic([l.vert.co for l in loops])
  mapping=affine_uv(loops,uv)
  # Feather only front cloth within 25 mm of the rim, never other open
  # edges, and never by more than 1 cm (anything further is not this repair).
  other={v for e in bm.edges if e.is_boundary and e not in rim for v in e.verts}
  feathered=[v for v in rv|{l.vert for f in near for l in f.loops} if distance(v.co)<.025 and v not in other]
  for v in feathered:
   w=1-smooth(distance(v.co)/.025);dy=surface(v.co.x,v.co.z)-v.co.y
   if abs(dy)<.01:v.co.y+=w*dy
  filled=bmesh.ops.holes_fill(bm,edges=rim,sides=0)['faces']
  # Give each fill an interior point, laid on the fitted surface.
  fan=bmesh.ops.poke(bm,faces=filled)
  for v in fan['verts']:v.co.y=surface(v.co.x,v.co.z)
  # Relax the repaired patch in depth with its outer ring held, so no dip
  # from the old slot survives.
  free=[v for v in feathered if distance(v.co)<.02 and v not in rv]+list(fan['verts'])
  for _ in range(16):bmesh.ops.smooth_vert(bm,verts=free,factor=.5,use_axis_x=False,use_axis_y=True,use_axis_z=False)
  bm.normal_update()
  for f in fan['faces']:
   if f.normal.y>0:f.normal_flip()
   f.material_index=bid;f.smooth=True
   for l in f.loops:l[uv].uv=mapping(l.vert.co.x,l.vert.co.z)
 bm.normal_update();bm.to_mesh(obj.data);bm.free();obj.data.update()
def close_cuts(obj,names):
 # The dinner source has two open dart cuts at the sides. Close any small
 # opening in the body; narrow slits (a buttonhole) stay as authored.
 bid=names.index('body')
 bm=bmesh.new();bm.from_mesh(obj.data);uv=bm.loops.layers.uv.active
 seen=set();closed=0
 for e in bm.edges:
  if e in seen or not e.is_boundary or e.link_faces[0].material_index!=bid:continue
  loop=[];stack=[e]
  while stack:
   x=stack.pop()
   if x in seen:continue
   seen.add(x);loop.append(x)
   for v in x.verts:stack.extend(n for n in v.link_edges if n.is_boundary and n not in seen)
  vs={v for x in loop for v in x.verts}
  ext=[max(v.co[i] for v in vs)-min(v.co[i] for v in vs) for i in range(3)]
  if len(loop)>16 or max(ext[0],ext[1])<.03 or ext[2]>.08:continue
  around=[l for v in vs for f in v.link_faces for l in f.loops]
  faces=bmesh.ops.holes_fill(bm,edges=loop,sides=0)['faces']
  for f in faces:
   f.material_index=bid;f.smooth=True
   for l in f.loops:
    src=next((a for a in around if a.vert==l.vert),None)
    if src:l[uv].uv=src[uv].uv
  closed+=1
 bm.normal_update();bm.to_mesh(obj.data);bm.free();obj.data.update()
 if closed:print(obj.name,'closed cuts:',closed)
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
   keep_pocket_cloth(o,names)
   close_cuts(o,names)
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
 # Below the bottom button row (its rims are about 1.00 m up).
 for v in p.data.vertices:v.co.y+=.016;v.co.z-=.020
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
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=.003,location=(0,-.17,1.38-i*.045));o=bpy.context.object;o.scale.y=.4;bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);finish(o,f'shirt_button_{i}','Shirt',0)
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
# The single-breasted and dinner bodies are cut open under the hip-pocket
# flap (the flap was its own island in the source). The straight flap hides the
# opening; slanted, patch and jetted pockets leave it showing as a dark gap. Fill
# each such opening, giving new faces the UVs of their edge vertices so the
# cloth texture carries across.
# The patch and slanted pockets used to be stretched or sheared copies of the
# flap. Stretching opened the flap's folded edge into slats you could see
# through, and neither followed the body. Build them as panels laid onto the
# body instead: a grid ray-cast onto the cloth from the front, lifted, given
# thickness, with UVs following the body's own scale (the studio draws them
# without the body normal map, whose darts and seams they cannot match).
# Each keeps its object name.
def fit_uv_map(body,x0,x1,z0,z1):
 bl=body.data.uv_layers.active.data;A=[[0.0]*3 for _ in range(3)];bu=[0.0]*3;bv=[0.0]*3
 for poly in body.data.polygons:
  c=poly.center
  if not(x0<c.x<x1 and z0<c.z<z1 and poly.normal.y<-.3):continue
  for li in poly.loop_indices:
   co=body.data.vertices[body.data.loops[li].vertex_index].co;row=(co.x,co.z,1.0);u=bl[li].uv
   for i in range(3):
    bu[i]+=row[i]*u.x;bv[i]+=row[i]*u.y
    for j in range(3):A[i][j]+=row[i]*row[j]
 return solve3(A,bu),solve3(A,bv)
def pocket_panel(kind,variant,lift=.0015,thickness=.0024,cols=26,rows=14,clearance=.0006):
 body=bpy.data.objects[f'{kind}_body'];tree=BVHTree.FromObject(body,bpy.context.evaluated_depsgraph_get())
 flap=bpy.data.objects[f'{kind}_pocket_flap'];verts=[];faces=[];uvs=[];floor=[];supported=[]
 for side in [-1,1]:
  fv=[v.co for v in flap.data.vertices if v.co.x*side>0]
  ax0,ax1=min(abs(v.x) for v in fv),max(abs(v.x) for v in fv);top=max(v.z for v in fv);bottom=min(v.z for v in fv)
  if variant=='patch':
   # A patch pocket: the flap's width, from its top edge down 12 cm.
   ztop=lambda s:top+.003;height=lambda s:.12
  elif variant in ('slanted','flap'):
   # A 35 mm flap; the hacking (slanted) flap's front end is 22 mm higher.
   rise=.022 if variant=='slanted' else 0
   ztop=lambda s,rise=rise:top+rise*(1-s);height=lambda s:.035
  else:
   # Jetted: a narrow welt along the opening's top edge.
   ztop=lambda s:top;height=lambda s:.008
  cu,cv=fit_uv_map(body,ax0*(1 if side>0 else -1)-.03 if side>0 else -ax1-.03,ax1+.03 if side>0 else -ax0+.03,top-.16,top+.04)
  lift_uv=0
  # A smooth quadratic depth y(x, z) fitted to the front-facing body around
  # the pocket: the panel follows the hip without picking up seams or the
  # filled opening.
  lo,hi=(ax0-.03,ax1+.03) if side>0 else (-ax1-.03,-ax0+.03)
  ref=sorted(v.co.y for v in body.data.vertices if lo<v.co.x<hi and top-.16<v.co.z<top+.04 and v.normal.y<-.3)
  mid=ref[len(ref)//2]
  pts=[v.co for v in body.data.vertices if lo<v.co.x<hi and top-.16<v.co.z<top+.04 and v.normal.y<-.3 and abs(v.co.y-mid)<.05]
  terms=lambda x,z:(1.0,x,z,x*x,x*z,z*z)
  N=[[0.0]*6 for _ in range(6)];rhs=[0.0]*6
  for q in pts:
   t=terms(q.x,q.z)
   for i in range(6):
    rhs[i]+=t[i]*q.y
    for j in range(6):N[i][j]+=t[i]*t[j]
  k=solve(N,rhs);surface=lambda x,z:sum(a*b for a,b in zip(k,terms(x,z)))
  start=len(verts)
  for r in range(rows+1):
   t=r/rows
   for c in range(cols+1):
    # The patch's outer edge sits 9 mm in from the flap's: beyond that the
    # hip curves away and there is no front cloth to lay it on.
    inner,outer=ax0-.004,ax1+.004-(.009 if variant=='patch' else 0)
    s_=c/cols;x=side*(inner+(outer-inner)*s_);z=ztop(s_)-t*height(s_)
    if variant=='patch':
     # Round the two bottom corners (2 cm radius).
     R=.02;cx=side*(inner+R) if s_<.5 else side*(outer-R);cz=ztop(s_)-height(s_)+R
     if z<cz and (abs(x)<abs(cx) if s_<.5 else abs(x)>abs(cx)):
      d=Vector((x-cx,z-cz));d=d.normalized()*min(d.length,R) if d.length>R else d;x,z=cx+d.x,cz+d.y
    verts.append(Vector((x,surface(x,z)-lift,z)))
    uvs.append((cu[0]*x+cu[1]*(z+lift_uv)+cu[2],cv[0]*x+cv[1]*(z+lift_uv)+cv[2]))
  # Follow the cloth itself, smoothed so seams don't print through, and never
  # closer than 0.6 mm. A hit more than 1.5 cm behind the fitted surface is
  # the back of the jacket, seen through the open front: use the fit there.
  W=cols+1;cloth=[]
  for i in range(start,len(verts)):
   v=verts[i];hit,normal,_,_=tree.ray_cast(Vector((v.x,-1,v.z)),Vector((0,1,0)))
   ok=hit is not None and normal.y<-1e-4 and hit.y<0
   supported.append(ok);cloth.append(hit.y if ok else v.y+lift)
  ys=[c-lift for c in cloth]
  for _ in range(12):
   nxt=ys[:]
   for r in range(1,rows):
    for c in range(1,cols):
     i=r*W+c;nxt[i]=(ys[i-1]+ys[i+1]+ys[i-W]+ys[i+W])/4
   ys=[min(y,c-clearance) for y,c in zip(nxt,cloth)]
  for i,y in enumerate(ys):verts[start+i].y=y
  for r in range(rows):
   for c in range(cols):
    a=start+r*(cols+1)+c;b=a+1;d=a+cols+1;e=d+1
    # No pocket where there is no front cloth under it (past the side curve).
    if not all(supported[q] for q in (a,b,d,e)):continue
    # Wind toward the viewer (-y) on both sides.
    faces.append((a,d,e,b) if side>0 else (a,b,e,d))
 mesh=bpy.data.meshes.new(f'{kind}_pocket_{variant}');mesh.from_pydata([tuple(v) for v in verts],[],faces);mesh.update()
 layer=mesh.uv_layers.new(name='UVMap')
 for loop in mesh.loops:layer.data[loop.index].uv=uvs[loop.vertex_index]
 obj=bpy.data.objects.get(f'{kind}_pocket_{variant}')
 if obj:old=obj.data;obj.data=mesh;bpy.data.meshes.remove(old)
 else:obj=bpy.data.objects.new(f'{kind}_pocket_{variant}',mesh);bpy.context.collection.objects.link(obj)
 finish(obj,obj.name,'Cloth',0)
 # Face the panel front if the winding came out inward, then thicken toward the body.
 bm=bmesh.new();bm.from_mesh(mesh);bm.normal_update()
 if sum((f.normal.y for f in bm.faces))>0:bmesh.ops.reverse_faces(bm,faces=bm.faces[:])
 bm.to_mesh(mesh);bm.free()
 if not thickness:return
 bpy.context.view_layer.objects.active=obj
 sol=obj.modifiers.new('Pocket thickness','SOLIDIFY');sol.thickness=thickness;sol.offset=-1;sol.use_even_offset=True
 bpy.ops.object.modifier_apply(modifier=sol.name)
# The source's pocket left a crescent-shaped dip in the cloth below each
# opening, wider than the low-poly repair reaches; it showed under every pocket
# style. Smooth the hip area of the subdivided body (positions, so triangle
# spacing evens out too), fading out
# toward the edge of the area and kept clear of the jacket's open edges (the
# front edge, where the fronts overlap, is a real step).
def smooth_pocket_area(kind,iterations=120):
 body=bpy.data.objects[f'{kind}_body'];flap=bpy.data.objects[f'{kind}_pocket_flap']
 bm=bmesh.new();bm.from_mesh(body.data);bm.normal_update();bm.verts.ensure_lookup_table()
 edge=[v.co.copy() for v in bm.verts if v.is_boundary]
 etree=BVHTree.FromPolygons(edge,[(i,i,i) for i in range(len(edge))]) if edge else None
 weights={}
 for side in (-1,1):
  fv=[v.co for v in flap.data.vertices if v.co.x*side>0]
  x0,x1=min(v.x for v in fv)-.03,max(v.x for v in fv)+.03
  z0,z1=min(v.z for v in fv)-.07,max(v.z for v in fv)+.03
  for v in bm.verts:
   c=v.co
   # Any front-ish face: a crease's own walls face up or down, not forward.
   if not(x0<c.x<x1 and z0<c.z<z1) or v.normal.y>0 or c.y>0 or v.is_boundary:continue
   if etree:
    _,_,_,d=etree.find_nearest(c)
    if d is not None and d<.012:continue
   inset=min(c.x-x0,x1-c.x,c.z-z0,z1-c.z)
   weights[v]=smooth(inset/.02)
 for _ in range(iterations):
  new={}
  for v,w in weights.items():
   ns=[e.other_vert(v) for e in v.link_edges]
   if not ns:continue
   # All three axes: depth alone left the fill's long fan triangles, whose
   # uneven spacing still creased the shading.
   avg=sum((n.co for n in ns),Vector())/len(ns)
   new[v]=v.co+(avg-v.co)*(w*.5)
  for v,co in new.items():v.co=co
 bm.normal_update();bm.to_mesh(body.data);bm.free();body.data.update()
# The MakeHuman buttons were authored for a closed body and pushed forward;
# after the open-quarter reshaping they float off the cloth, visibly so from
# the side. Seat each button on the surface beneath it. Front buttons sit on
# the left forepart (under the wearer's right); it ends just right of the
# buttons, where the right forepart overlaps it 1 cm further forward. Shift
# them 1.4 cm toward the left so they sit on cloth, not at that step.
def seat(obj,tree,gap=.0004):
 vs=obj.data.vertices;c=sum((v.co for v in vs),Vector())/len(vs)
 loc,normal,_,_=tree.find_nearest(c)
 # Outward from the garment's centre line, not toward the button's current
 # position: a button that starts under the cloth would be seated inside it.
 if normal.dot(Vector((loc.x,loc.y+.02,0)))<0:normal=-normal
 back=min((v.co-c).dot(normal) for v in vs)
 delta=loc+normal*(gap-back)-c
 for v in vs:v.co+=delta
FRONT_BUTTONS={'single':[10,11],'dinner':[14]}
for kind in ['single','double','dinner']:
 for i in FRONT_BUTTONS.get(kind,[]):
  o=bpy.data.objects.get(f'{kind}_button_{i}')
  if o:
   for v in o.data.vertices:v.co.x-=.014
 smooth_pocket_area(kind)
 pocket_panel(kind,'patch',cols=34,rows=28,lift=.002,clearance=.001)
 pocket_panel(kind,'slanted',thickness=.0015,cols=40,rows=12)
 pocket_panel(kind,'welt',lift=.0012,thickness=.0012,rows=3)
 # The straight flap too, last (the other styles take their position from
 # the authored one): the authored flap was shaped for the old bulging hip and
 # does not sit on the filled cloth, the dinner "flap" is an open oval mouth,
 # and the double one is a moved copy that does not fit its body.
 pocket_panel(kind,'flap',thickness=.0015,cols=40,rows=12)
 tree=BVHTree.FromObject(bpy.data.objects[f'{kind}_body'],bpy.context.evaluated_depsgraph_get())
 for o in list(bpy.data.objects):
  if o.type=='MESH' and o.name.startswith(f'{kind}_button_'):seat(o,tree)
# Shirt buttons were placed at a fixed depth and float in front of the shirt
# when the suit is turned; seat them on it.
shirt_tree=BVHTree.FromObject(bpy.data.objects['single_shirt_7'],bpy.context.evaluated_depsgraph_get())
for i in range(3):seat(bpy.data.objects[f'shirt_button_{i}'],shirt_tree,gap=.0002)
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
