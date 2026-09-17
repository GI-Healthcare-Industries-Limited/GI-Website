"""Original GI vision diorama. Authored with the user's Blender 5.2.2.

Geometry is authored in metres, Y-up. Blender's glTF exporter converts our
internal Z-up meshes back to the web scene's Y-up axes. Meshes are batched
by destination and material so picking stays meaningful without thousands
of draw calls. Original geometry; CC0 photographic surface maps and foliage
from Poly Haven. See ASSET-CREDITS.md. No executable third-party blend files.
"""
import bpy, math, random, os
from mathutils import Vector
from collections import defaultdict

print('GI: starting geometry authoring', flush=True)
random.seed(24)
OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../public/assets'))
os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
PALETTE = {
 'chalk':'F0F0DF', 'white':'FCF8ED', 'glass':'75ACBB', 'glass-dark':'376271',
 'glass-light':'B7DCE3', 'steel':'99B1B4', 'silver':'C9D5D3', 'dark':'344D58',
 'asphalt':'61716C', 'path':'D5D7BE', 'sand':'E3D4B1', 'rock':'BAAD91',
 'rock-dark':'9B9F91', 'grass':'96B76D', 'grass-light':'B3CA86',
 'green':'73994D', 'green-dark':'437458', 'green-light':'9CBC66',
 'trunk':'82674A', 'terracotta':'BF7860', 'coral':'D77D64', 'red':'CB4E45',
 'orange':'E6AC59', 'yellow':'F5D282', 'blue':'407C9A', 'navy':'244B6C',
 'snow':'DDEFF2', 'ice':'ACD5DD', 'solar':'254B69', 'smoke':'C5C8C0',
 'mars':'C88868', 'moon':'D2D3CB', 'black':'283637', 'wood':'C6AA7F',
 'leaves':'FFFFFF', 'roof-tile':'BE8068', 'concrete':'D0CEC3',
}

def linear(v): return v / 12.92 if v < .04045 else ((v + .055)/1.055)**2.4
MATERIALS = {}
for name,h in PALETTE.items():
 m=bpy.data.materials.new(name)
 bs=m.node_tree.nodes.get('Principled BSDF')
 bs.inputs['Base Color'].default_value=tuple(linear(int(h[i:i+2],16)/255) for i in (0,2,4))+(1,)
 bs.inputs['Roughness'].default_value=.76 if 'glass' not in name else .13
 bs.inputs['Metallic'].default_value=.82 if name in ['steel','silver'] else (.32 if 'glass' in name or name=='solar' else 0)
 if name=='silver':bs.inputs['Roughness'].default_value=.26
 if name=='steel':bs.inputs['Roughness'].default_value=.38
 MATERIALS[name]=m

# Resize the source maps once for web delivery; retain the originals and their
# licence manifest. Every map is local and embedded in the exported GLBs.
TEXTURE_DIR=os.path.join(OUT,'materials')
PROXY_DIR=os.path.join(TEXTURE_DIR,'web');os.makedirs(PROXY_DIR,exist_ok=True)
def image_map(file,colour=True,size=512):
 src=os.path.join(TEXTURE_DIR,file);target=os.path.join(PROXY_DIR,file)
 if not os.path.exists(target):
  img=bpy.data.images.load(src,check_existing=True)
  img.scale(size,size);img.filepath_raw=target
  img.file_format='PNG' if file.endswith('.png') else 'JPEG';img.save()
 img=bpy.data.images.load(target,check_existing=True)
 if not colour:img.colorspace_settings.name='Non-Color'
 return img
def surface(mat,source,normal_strength=.35):
 m=MATERIALS[mat];nodes=m.node_tree.nodes;links=m.node_tree.links;bs=nodes.get('Principled BSDF')
 colour=nodes.new('ShaderNodeTexImage');colour.image=image_map(source+'-colour.jpg')
 links.new(colour.outputs['Color'],bs.inputs['Base Color'])
 normal=nodes.new('ShaderNodeTexImage');normal.image=image_map(source+'-normal.jpg',False)
 bump=nodes.new('ShaderNodeNormalMap');bump.inputs['Strength'].default_value=normal_strength
 links.new(normal.outputs['Color'],bump.inputs['Color']);links.new(bump.outputs['Normal'],bs.inputs['Normal'])
for material,source in [('grass','grass'),('rock','rock'),('rock-dark','rock'),('wood','oak'),('trunk','wood'),('chalk','concrete'),('concrete','concrete')]:
 surface(material,source,.28 if material=='chalk' else .55)
 # Painted stucco/concrete keeps the approved ivory palette, with the real
 # photographed microstructure rather than a brown unpainted albedo.
 if material in ['chalk','concrete']:
  input=MATERIALS[material].node_tree.nodes.get('Principled BSDF').inputs['Base Color']
  for link in list(input.links):MATERIALS[material].node_tree.links.remove(link)
for name in ['moon','mars']:
 m=MATERIALS[name];tex=m.node_tree.nodes.new('ShaderNodeTexImage')
 tex.image=bpy.data.images.load(os.path.join(TEXTURE_DIR,name+'-colour.jpg'),check_existing=True)
 m.node_tree.links.new(tex.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
m=MATERIALS['leaves'];nodes=m.node_tree.nodes;links=m.node_tree.links;bs=nodes.get('Principled BSDF')
leaf=nodes.new('ShaderNodeTexImage');leaf.image=image_map('leaves.png',size=1024)
alpha=nodes.new('ShaderNodeTexImage');alpha.image=image_map('leaves-alpha.png',False,size=1024)
links.new(leaf.outputs['Color'],bs.inputs['Base Color']);links.new(alpha.outputs['Color'],bs.inputs['Alpha'])
m.surface_render_method='DITHERED';m.use_backface_culling=False

parts=defaultdict(lambda: [[],[],[],[]]); group='terrain'; origin=(0,0,0); angle=0; zoom=1
def scope(name, offset=(0,0,0), rotation=0, scale=1):
 global group,origin,angle,zoom
 group,origin,angle,zoom=name,offset,rotation,scale
def mesh(verts,faces,mat,uv=None,smooth=False):
 assert all(0 <= index < len(verts) for face in faces for index in face), 'Invalid geometry in '+group
 data=parts[(group,mat)]; base=len(data[0]); c=math.cos(angle); s=math.sin(angle)
 for x,y,z in verts:
  X=origin[0]+(x*c+z*s)*zoom; Y=origin[1]+y*zoom; Z=origin[2]+(-x*s+z*c)*zoom
  data[0].append((X,-Z,Y))
 # Swapping Y/Z with one sign is a rotation, so preserve winding.
 data[1].extend([tuple(base+i for i in face) for face in faces])
 data[2].extend([uv if uv else None for face in faces])
 data[3].extend([smooth for face in faces])
def box(x,y,z,w,h,d,mat='chalk'):
 v=[(x+sx*w/2,y+sy*h/2,z+sz*d/2) for sx,sy,sz in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
 mesh(v,[(0,3,2,1),(4,5,6,7),(0,4,7,3),(1,2,6,5),(3,7,6,2),(0,1,5,4)],mat)
def cylinder(x,y,z,r,h,mat='chalk',n=24,top=None):
 n=max(n,12)
 rt=r if top is None else top
 v=[(x+math.cos(a*math.tau/n)*R,Y,z+math.sin(a*math.tau/n)*R) for R,Y in [(r,y-h/2),(rt,y+h/2)] for a in range(n)]
 mesh(v,[tuple(range(n)),tuple(range(2*n-1,n-1,-1))],mat)
 mesh(v,[(i,i+n,(i+1)%n+n,(i+1)%n) for i in range(n)],mat,smooth=True)
def sphere(x,y,z,r,mat='chalk',sx=1,sy=1,sz=1,rings=12,n=24):
 rings=max(8,rings);n=max(16,n)
 v=[]
 for j in range(rings+1):
  p=math.pi*j/rings
  for i in range(n):
   t=i*math.tau/n; v.append((x+r*sx*math.sin(p)*math.cos(t),y+r*sy*math.cos(p),z+r*sz*math.sin(p)*math.sin(t)))
 f=[]
 for j in range(rings):
  for i in range(n): f.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
 mesh(v,f,mat,smooth=True)
def beam(a,b,width,mat='steel'):
 A=Vector(a);B=Vector(b);d=B-A; ref=Vector((0,1,0))
 if abs(d.normalized().dot(ref))>.95: ref=Vector((1,0,0))
 u=d.cross(ref).normalized()*width/2; v=d.normalized().cross(u).normalized()*width/2
 vs=[tuple(p+su*u+sv*v) for p in (A,B) for su,sv in [(-1,-1),(1,-1),(1,1),(-1,1)]]
 mesh(vs,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],mat)
def roof(x,y,z,w,h,d,mat='terracotta'):
 mesh([(x-w/2,y,z-d/2),(x+w/2,y,z-d/2),(x+w/2,y,z+d/2),(x-w/2,y,z+d/2),(x,y+h,z-d/2),(x,y+h,z+d/2)],[(0,4,1),(3,2,5),(0,3,5,4),(1,4,5,2),(0,1,2,3)],mat)
def rounded_slab(w,d,h,y,r,mat):
 ring=[]
 for cx,cz,base in [(w/2-r,d/2-r,0),(-w/2+r,d/2-r,90),(-w/2+r,-d/2+r,180),(w/2-r,-d/2+r,270)]:
  for i in range(6):
   t=math.radians(base+i*90/5); ring.append((cx+math.cos(t)*r,cz+math.sin(t)*r))
 n=len(ring); verts=[(x,Y,z) for Y in (y-h/2,y+h/2) for x,z in ring]
 faces=[tuple(range(n)),tuple(range(2*n-1,n-1,-1))]+[(i,n+i,n+(i+1)%n,(i+1)%n) for i in range(n)]
 mesh(verts,faces,mat)
def foliage(cx,cy,cz,width,height,rotation,tilt):
 # Crossed, individually oriented botanical branch cards. Alpha-masked real
 # leaves retain their fine silhouette rather than a solid geometric canopy.
 right=Vector((math.cos(rotation),0,math.sin(rotation)))*width/2
 up=Vector((math.sin(rotation)*math.sin(tilt),math.cos(tilt),-math.cos(rotation)*math.sin(tilt)))*height/2
 c=Vector((cx,cy,cz))
 mesh([tuple(c-right-up),tuple(c+right-up),tuple(c+right+up),tuple(c-right+up)],[(0,1,2,3)],'leaves',uv=[(.052,.86),(.18,.86),(.18,.954),(.052,.954)])
def tree(x,z,h=1.4,y=1.25,pine=False):
 cylinder(x,y+h*.36,z,h*.032,h*.72,'trunk',12,top=h*.011)
 phase=random.uniform(0,math.tau)
 for level in range(4):
  fraction=.4+level*.16
  reach=h*(.38-level*.065 if pine else (.33 if level<3 else .2))
  for b in range(5):
   t=phase+b*math.tau/5+level*.85
   tip=(x+math.cos(t)*reach,y+h*fraction+.12*h,z+math.sin(t)*reach)
   beam((x,y+h*fraction,z),tip,h*.013,'trunk')
   for k in range(7):
    f=.45+k*.1
    foliage(x+(tip[0]-x)*f+random.uniform(-.15,.15)*h,tip[1]+random.uniform(-.12,.16)*h,z+(tip[2]-z)*f+random.uniform(-.15,.15)*h,h*.23,h*.17,t+k*1.3,random.uniform(-1.3,1.3))
def windows(x,y,z,w,h,d,rows=3):
 cols=max(2,int(w/.48))
 for row in range(rows):
  Y=y-h/2+.38+row*(h-.25)/rows
  for col in range(cols):
   X=x-w/2+.24+(w-.48)*col/max(1,cols-1)
   box(X,Y,z+d/2+.008,.23,.29,.018,'glass')
   box(X,Y,z-d/2-.008,.23,.29,.018,'glass')
   for side in [-1,1]:
    Z=z+side*(d/2+.034)
    box(X,Y-.17,Z,.3,.035,.085,'white')
    box(X-.135,Y,Z,.023,.33,.035,'white');box(X+.135,Y,Z,.023,.33,.035,'white')
    box(X,Y+.165,Z,.29,.025,.04,'white')
  for col in range(max(2,int(d/.48))):
   Z=z-d/2+.24+(d-.48)*col/max(1,int(d/.48)-1)
   box(x+w/2+.008,Y,Z,.018,.29,.24,'glass')
def building(x,z,w,d,h,mat='white',glass=False,y=1.3,pitched=False):
 box(x,y+h/2,z,w,h,d,'glass' if glass else mat)
 box(x,y+.04,z,w+.18,.12,d+.18,'path')
 # Flat roof: recessed membrane, parapet coping and service equipment.
 if not pitched:
  box(x,y+h+.008,z,w,.025,d,'asphalt')
  for X in [x-w/2,x+w/2]:box(X,y+h+.095,z,.075,.2,d+.08,'white')
  for Z in [z-d/2,z+d/2]:box(x,y+h+.095,Z,w+.08,.2,.075,'white')
 if glass:
  for Y in [y+.38+i*.43 for i in range(int(h/.43))]:
   box(x,Y,z,w+.02,.055,d+.02,'chalk')
  for X in [x-w/2+i*w/4 for i in range(5)]:
   box(X,y+h/2,z,.045,h,d+.05,'chalk')
  for Z in [z-d/2+i*d/3 for i in range(4)]: box(x,y+h/2,Z,w+.05,h,.045,'chalk')
  # Exterior glazing sits in front of the structural grid on every elevation.
  for Y in [y+.38+i*.43 for i in range(int(h/.43))]:
   for i in range(4):
    X=x-w/2+(i+.5)*w/4
    for Z in [z-d/2-.04,z+d/2+.04]:box(X,Y+.2,Z,w/4-.06,.34,.02,'glass')
   for i in range(3):
    Z=z-d/2+(i+.5)*d/3
    for X in [x-w/2-.04,x+w/2+.04]:box(X,Y+.2,Z,.02,.34,d/3-.06,'glass')
 else: windows(x,y+h/2,z,w,h,d,max(1,int(h/.65)))
 if not pitched:
  box(x+.16,y+h+.24,z-.1,w*.3,.22,d*.32,'steel')
  for i in range(3): box(x+.16,y+h+.36,z-.18+i*.09,w*.24,.02,.035,'dark')
  cylinder(x-w*.22,y+h+.2,z+d*.22,.09,.35,'silver')
 box(x,y+.44,z+d/2+.04,.35,.86,.05,'glass-dark')
 box(x,y+.9,z+d/2+.16,.54,.035,.4,'steel')
 for X in [x-w*.43,x+w*.43]:
  beam((X,y+.03,z+d/2+.035),(X,y+h,z+d/2+.035),.033,'steel')
def bench(x,z,y=1.3):
 for Z in [-.1,0,.1]:box(x,y+.28,z+Z,.85,.045,.085,'wood')
 for Y in [.43,.54,.65]:box(x,y+Y,z-.12,.85,.085,.035,'wood')
 for X in (x-.3,x+.3):box(X,y+.14,z,.055,.28,.26,'dark')
def vehicle(x,z,color='coral',y=1.28):
 box(x,y+.18,z,.42,.27,.9,color);box(x,y+.4,z-.05,.38,.22,.48,color)
 box(x,y+.4,z+.197,.32,.15,.016,'glass-dark')
 for X in (x-.24,x+.24):
  for Z in (z-.28,z+.28): sphere(X,y+.13,Z,.12,'dark',sx=.45,n=8,rings=4)
def solar(x,y,z,w=1.1,d=.7):
 box(x,y,z,w,.045,d,'solar')
 for i in range(1,5):box(x-w/2+i*w/5,y+.027,z,.012,.009,d,'glass')
 box(x,y+.027,z,w,.009,.012,'glass')
def machine(x,y,z,s=1):
 box(x,y+.8*s,z,.83*s,1.6*s,.72*s,'silver')
 box(x+.1*s,y+.73*s,z+.371*s,.55*s,1.22*s,.025*s,'black')
 box(x-.27*s,y+1.01*s,z+.38*s,.19*s,.37*s,.026*s,'glass-dark')
 box(x-.37*s,y+.78*s,z+.43*s,.038*s,1.13*s,.05*s,'white')
 box(x+.05*s,y+1.46*s,z+.382*s,.14*s,.038*s,.018*s,'red')
 for X in (x-.3*s,x+.3*s):box(X,y+.03*s,z,.08*s,.1*s,.5*s,'dark')
 for i in range(10):box(x,y+.135*s+i*.014*s,z+.37*s,.64*s,.006*s,.014*s,'dark')
 for X in [x-.2*s,x+.4*s]:box(X,y+.74*s,z+.39*s,.015*s,1.24*s,.01*s,'steel')
 for Y in [y+.31*s,y+1.17*s]:box(x+.416*s,Y,z+.28*s,.025*s,.11*s,.06*s,'steel')
 box(x-.27*s,y+1.025*s,z+.399*s,.15*s,.29*s,.006*s,'black')
 for i in range(3):box(x-.27*s,y+.94*s+i*.032*s,z+.403*s,.11*s,.008*s,.002*s,'glass-light')
 cylinder(x-.27*s,y+.81*s,z+.4*s,.023*s,.024*s,'red')
def tiled_roof(x,y,z,w,h,d):
 roof(x,y,z,w,h,d,'roof-tile')
 slope=math.hypot(w/2,h)
 for side in [-1,1]:
  for row in range(1,9):
   f=row/9;X=x+side*w/2*f;Y=y+h*(1-f)+.013
   beam((X,Y,z-d/2),(X,Y,z+d/2),.018,'terracotta')
  for i in range(max(2,int(d/.14))+1):
   Z=z-d/2+i*d/max(2,int(d/.14))
   beam((x,y+h+.012,Z),(x+side*w/2,y+.012,Z),.009,'coral')
 for X in [x-w/2,x+w/2]:beam((X,y-.01,z-d/2),(X,y-.01,z+d/2),.045,'steel')
 beam((x,y+h+.01,z-d/2),(x,y+h+.01,z+d/2),.065,'terracotta')
def school():
 building(-1.1,0,1.55,3.1,1.35,'chalk',pitched=True);building(.9,-.95,2.45,1.2,1.35,'chalk',pitched=True)
 tiled_roof(-1.1,2.7,0,1.8,.42,3.3);tiled_roof(.9,2.7,-.95,2.65,.42,1.4)
 box(.75,1.32,.75,2.5,.06,1.8,'sand')
 for X in [-.4,0,.4,.8,1.2,1.6]:box(X,1.353,.75,.012,.003,1.8,'concrete')
 for Z in [0,.4,.8,1.2]:box(.75,1.353,Z,2.5,.003,.012,'concrete')
 for i in range(3):bench(.35+i*.58,.85)
 for X in [-2.1,2.1]: tree(X,1.8,1.2)
 box(-1.1,1.76,1.56,.6,.95,.028,'glass-dark')
 beam((1.9,1.3,1.5),(1.9,3.2,1.5),.035,'silver');box(2.1,3,1.5,.4,.24,.03,'coral')
 machine(.9,1.35,-.15,.4)
def rail():
 pts=[]; w=25.5;d=21.5;r=2
 for cx,cz,base in [(w/2-r,d/2-r,0),(-w/2+r,d/2-r,90),(-w/2+r,-d/2+r,180),(w/2-r,-d/2+r,270)]:
  for i in range(15):
   t=math.radians(base+i*90/14);pts.append((cx+r*math.cos(t),cz+r*math.sin(t)))
 for i,(x,z) in enumerate(pts):
  X,Z=pts[(i+1)%len(pts)]
  for side in [-.13,.13]:
   dx=X-x;dz=Z-z;dist=math.hypot(dx,dz)
   if dist<.001:continue
   nx=-dz/dist*side;nz=dx/dist*side
   beam((x+nx,1.33,z+nz),(X+nx,1.33,Z+nz),.025,'steel')
  steps=max(1,int(math.hypot(X-x,Z-z)/.22))
  for j in range(steps):
   a=j/steps;xx=x+(X-x)*a;zz=z+(Z-z)*a
   beam((xx-dz/max(dist,.01)*.21,1.3,zz+dx/max(dist,.01)*.21),(xx+dz/max(dist,.01)*.21,1.3,zz-dx/max(dist,.01)*.21),.045,'trunk')
def train():
 for i in range(4):
  x=i*1.48-2.2
  box(x,1.62,0,1.36,.38,.52,'white');box(x,1.49,0,1.4,.12,.56,'blue')
  sphere(x,1.81,0,.26,'white',sx=2.6,sy=.35,sz=1,n=24,rings=12)
  box(x,1.38,0,1.1,.09,.34,'black')
  if i<3:box(x+.72,1.58,0,.1,.34,.42,'dark')
  for j in range(5):
   for z in [-.268,.268]:box(x-.49+j*.23,1.72,z,.18,.18,.015,'glass-dark')
  for z in [-.276,.276]:
   box(x,1.575,z,1.29,.015,.01,'steel')
   for X in [x-.53,x+.53]:box(X,1.62,z,.085,.35,.018,'silver')
  for X in [x-.42,x+.42]:
   for z in [-.26,.26]:sphere(X,1.36,z,.11,'dark',sz=.45,n=8,rings=4)
 # Sculpted streamlined end cars, windshields and paired headlamps.
 for side in [-1,1]:
  X=-2.2 if side==-1 else 2.24
  sphere(X+side*.64,1.64,0,.25,'white',sx=1.9,sy=.87,sz=1.03,n=24,rings=12)
  box(X+side*.89,1.75,0,.025,.14,.37,'glass-dark')
  for Z in [-.18,.18]:sphere(X+side*1.0,1.55,Z,.026,'yellow',n=12)
def ship(kind='container'):
 # Tapered bow, flat deck, layered hull with raised forecastle.
 mesh([(-.7,.05,-2.8),(.7,.05,-2.8),(.8,.05,1.8),(0,.05,2.8),(-.8,.05,1.8),(-.9,.5,-2.8),(.9,.5,-2.8),(.9,.5,1.85),(0,.5,3),(-.9,.5,1.85)],[(0,4,3,2,1),(5,6,7,8,9),(0,1,6,5),(1,2,7,6),(2,3,8,7),(3,4,9,8),(4,0,5,9)],'dark')
 box(0,.52,-.4,1.6,.12,4.6,'sand')
 for side in [-1,1]:
  for Z in [-2.65,-2.25,-1.85,-1.45,-1.05,-.65,-.25,.15,.55,.95,1.35,1.75]:
   beam((side*.83,.53,Z),(side*.83,.78,Z),.018,'silver')
  for Y in [.64,.78]:beam((side*.83,Y,-2.65),(side*.83,Y,1.75),.017,'silver')
  for Z in [-2.3,-1.5,-.7,.1,.9]:box(side*.85,.31,Z,.013,.08,.18,'black')
 if kind=='container':
  for x in [-.4,.4]:
   for z in [-1.7,-.7,.3,1.3]:
    for y in [.85,1.34]:
     color=random.choice(['coral','orange','blue','red'])
     box(x,y,z,.72,.45,.88,color)
     for j in range(5):box(x-.32+j*.16,y,z+.448,.025,.4,.018,'terracotta')
  box(0,1.08,-2.25,1.4,1,.55,'white');box(0,1.64,-2.2,1.25,.12,.65,'white')
  for X in [-.5,-.25,0,.25,.5]:box(X,1.45,-1.966,.18,.13,.02,'glass-dark')
  cylinder(.35,1.95,-2.3,.12,.6,'red');beam((-.35,1.65,-2.25),(-.35,2.4,-2.25),.03,'white')
 else:
  box(0,.8,-.5,1.1,.5,2.2,'steel');box(0,1.25,-.7,.75,.55,1.2,'silver')
  box(0,1.67,-.7,.9,.15,1.15,'dark');beam((0,1.7,-.7),(0,3.4,-.7),.06,'steel')
  beam((-.55,2.5,-.7),(.55,2.5,-.7),.035,'steel')
  cylinder(0,.8,1.35,.32,.3,'silver');beam((0,1,1.35),(0,1.2,2.35),.09,'steel')
  for X in [-.78,.78]:beam((X,.7,-2.6),(X,.7,1.5),.028,'white')
def oilrig():
 for x in [-1.5,1.5]:
  for z in [-1.35,1.35]:
   cylinder(x,1.1,z,.23,3.8,'orange',12)
   box(x,-.3,z,.85,.35,.9,'red')
   beam((x,.15,-1.35),(x,2.6,1.35),.1,'steel');beam((x,.15,1.35),(x,2.6,-1.35),.1,'steel')
 box(0,2.8,0,3.8,.32,3.5,'orange');box(0,3,0,3.55,.08,3.25,'sand')
 for z in [-1.62,1.62]:
  beam((-1.8,3.5,z),(1.8,3.5,z),.04,'white')
  for x in [-1.8,-.9,0,.9,1.8]:beam((x,3.03,z),(x,3.5,z),.035,'white')
 for x in [-1.8,1.8]:beam((x,3.5,-1.62),(x,3.5,1.62),.04,'white')
 building(-.6,.3,1.8,1.5,1.1,'white',y=3.05)
 for x in [.4,1.3]:
  for z in [-1.2,-.3]:beam((x,3.1,z),(.85,7,z*.3-.45),.085,'steel')
 for y in [3.5,4.2,4.9,5.6,6.3]:
  ratio=(7-y)/4
  beam((.85-.45*ratio,y,-.75-.45*ratio),(.85+.45*ratio,y,-.75+.45*ratio),.055,'white')
  beam((.85+.45*ratio,y,-.75-.45*ratio),(.85-.45*ratio,y,-.75+.45*ratio),.055,'white')
 beam((-1,4,.6),(-1,5.5,.6),.12,'orange');beam((-1,5.5,.6),(-3.6,5,1.3),.12,'orange')
 beam((-3.6,5,1.3),(-3.6,3.8,1.3),.02,'dark')
 cylinder(-1.2,3.35,-1,.28,.55,'red',12)
def station():
 # Modular orbital habitat with radiating solar wings.
 sphere(0,0,0,1.2,'white',sy=.65,rings=10,n=20)
 cylinder(0,.22,0,.72,.9,'silver',24);cylinder(0,.7,0,.55,.12,'glass-dark',24)
 for side in [-1,1]:
  beam((side*.7,0,0),(side*4.5,0,0),.22,'silver')
  for x in [side*2.5,side*4.1]:
   for z in [-1.45,1.45]:
    solar(x,0,z,1.3,2.15)
    beam((x,-.1,0),(x,-.1,z),.065,'steel')
 for z in [-1.65,1.65]:
  sphere(0,0,z,.6,'chalk',sz=1.45,sy=.65,rings=8,n=16)
  for x in [-.5,.5]:beam((x,0,z*.75),(x,0,z*1.2),.11,'silver')
def airplane():
 sphere(0,0,0,.38,'white',sz=5.6,sy=.9,rings=24,n=40)
 mesh([(-.1,0,.45),(-2.5,0,-.7),(-2.45,0,-1.05),(-.1,0,-.55),(.1,0,.45),(2.5,0,-.7),(2.45,0,-1.05),(.1,0,-.55)],[(0,1,2,3),(4,7,6,5)],'chalk')
 for x in [-1,1]:
  sphere(x,-.25,.05,.2,'silver',sz=2,rings=16,n=24)
  sphere(x,-.25,.36,.165,'black',sz=.12,rings=12,n=24)
  sphere(x,-.25,.383,.049,'silver',sz=.6,rings=10,n=16)
  beam((x,-.25,0),(x,0,-.25),.065,'steel')
  for i in range(12):
   t=i*math.tau/12
   beam((x+math.cos(t)*.05,-.25+math.sin(t)*.05,.39),(x+math.cos(t+.3)*.14,-.25+math.sin(t+.3)*.14,.39),.012,'steel')
 mesh([(x,y,z) for x in [-.025,.025] for y,z in [(0,-1.4),(1.05,-1.8),(1.08,-2.1),(-.05,-1.9)]],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],'coral')
 box(0,.02,-1.6,1.5,.035,.38,'white')
 for side in [-1,1]:
  beam((side*2.46,0,-.88),(side*2.62,.3,-.98),.04,'white')
  box(side*.18,.18,1.65,.16,.16,.02,'glass-dark')
 for z in [-.9,-.6,-.3,0,.3,.6,.9]:
  for x in [-.32,.32]:box(x,.08,z,.02,.08,.11,'glass-dark')
def tent(x,z,color='orange'):
 roof(x,1.3,z,1.1,.8,1.3,color)
 mesh([(x-.46,1.32,z+.66),(x,2.04,z+.66),(x+.46,1.32,z+.66)],[(0,1,2)],'dark')
def mountain(x,z):
 vertices=[];rings=12;n=36
 for j in range(rings+1):
  t=j/rings
  for i in range(n):
   a=i*math.tau/n
   radius=(1-t)**.85*(1.45+.17*math.sin(a*5)+.14*math.sin(a*9+t*2))
   vertices.append((x+math.cos(a)*radius+.3*t,.96+2.7*t+.09*math.sin(a*7)*math.sin(t*math.pi),z+math.sin(a)*radius))
 faces=[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for j in range(rings) for i in range(n)]
 mesh(vertices,[tuple(reversed(f)) for f in faces],'snow',smooth=True)
def world():
 scope('terrain')
 # Textured geological cutaway instead of the smooth, layered toy plinth.
 rounded_slab(26.6,22.6,2.3,-.08,.7,'rock')
 for side in [-1,1]:
  for i in range(36):
   z=-10.5+i*.6
   sphere(side*13.15,random.uniform(-.55,.65),z,random.uniform(.25,.5),'rock',sx=.4,sy=random.uniform(.6,1.3),sz=1.4,n=12,rings=8)
  for i in range(42):
   x=-12.5+i*.6
   sphere(x,random.uniform(-.55,.65),side*11.15,random.uniform(.25,.5),'rock',sx=1.4,sy=random.uniform(.6,1.3),sz=.4,n=12,rings=8)
 rounded_slab(26.2,22.2,.22,1.12,1.2,'grass')
 for z in [-8,0,8]:
  box(0,1.26,z,24,.045,1.2,'asphalt')
  for x in range(-11,12):box(x,1.29,z,.4,.015,.045,'chalk')
  for Z in [z-.66,z+.66]:box(0,1.27,Z,24,.055,.12,'path')
 for x in [-9,0,9]:
  box(x,1.26,0,1.2,.045,16,'asphalt')
  for z in range(-7,8):box(x,1.29,z,.045,.015,.4,'chalk')
  for X in [x-.66,x+.66]:box(X,1.27,0,.12,.055,16,'path')
 for x in [-9,0,9]:
  for z in [-8,0,8]:
   for j in range(5):box(x-.42+j*.2,1.3,z+.9,.1,.016,.65,'chalk')
 rail()
 for i in range(90):
  x=random.choice([-1,1])*random.uniform(10.3,12);z=random.uniform(-9.4,9.4)
  if abs(z)%8<.8:continue
  tree(x,z,random.uniform(.7,1.6),pine=i%3==0)
 for x,z in [(-7,5.3),(-3,4.8),(3,2),(4,8.9),(-6,-4.6),(3,-6),(7,7)]:
  for i in range(4):tree(x+i*.45,z,.9)
 for x,z in [(-9,4),(0,-4),(9,6),(-5,0),(4,8)]:vehicle(x,z,random.choice(['coral','white','blue']))
 for x in [-8.15,.85,8.15]:
  for z in [-6,3,7]:
   cylinder(x,1.9,z,.028,1.3,'dark',6);beam((x,2.55,z),(x+.3,2.55,z),.04,'dark');box(x+.3,2.54,z,.22,.07,.12,'white')
 scope('school',(-6.8,0,3));school()
 scope('university',(-5.1,0,-3));building(-1,0,1.4,3.1,1.75);building(.7,-1,2.7,1.1,1.75)
 box(.8,1.31,.8,2.4,.05,2,'path');bench(.5,1.2);bench(1.3,1.2)
 scope('office',(-5,0,-6.6));building(-1,-.2,1.9,1.8,6,glass=True);building(1,0,1.5,1.6,4.4,glass=True);building(2,-1,1.15,1.3,2.5,glass=True)
 scope('hospital',(4,0,-2.8));building(0,0,3.2,1.5,2.5);building(-.8,1.3,1.6,1.3,1.8);building(.3,-1.2,2.4,1.1,2.1)
 box(0,3.1,.77,.62,.18,.026,'red');box(0,3.1,.79,.18,.62,.026,'red');solar(.8,3.94,-.1)
 scope('home',(-6,0,6.7))
 for x,z in [(-1,0),(1,.35),(-2,1.7)]:
  building(x,z,1.1,1,1,pitched=True);tiled_roof(x,2.31,z,1.3,.55,1.2)
  tree(x+.7,z+.4,.9)
 scope('camping',(-10,0,-3.9));tent(0,0);tent(.6,1.4,'chalk');tree(-.7,-1.2,1.7,pine=True)
 scope('festival',(3,0,5.1));box(0,1.75,-.5,3.2,.8,1.7,'dark');box(0,3.3,-.9,3.4,.12,2,'white')
 for x in [-1.5,1.5]:beam((x,1.7,.2),(x,3.3,.2),.08,'steel')
 box(0,2.5,-1.25,2.8,1.2,.05,'navy')
 for x in [-1.35,-.7,0,.7,1.35]:sphere(x,3.1,-.15,.075,'yellow',n=8,rings=4)
 for i in range(150):
  x=random.uniform(-1.6,1.6);z=random.uniform(.8,2.6)
  cylinder(x,1.45,z,.045,.3,random.choice(['blue','coral','chalk','dark','yellow']),6);sphere(x,1.64,z,.058,'sand',n=6,rings=3)
 scope('industry',(7.2,0,-5.8))
 for x in [-1,1]:
  profile=[(1.35,.85),(1.55,.85),(2.3,.56),(3.3,.45),(4,.6),(4.1,.64)]
  n=24;v=[(x+math.cos(i*math.tau/n)*r,Y,math.sin(i*math.tau/n)*r) for Y,r in profile for i in range(n)];f=[]
  for j in range(len(profile)-1):
   for i in range(n):f.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
  mesh(v,[tuple(reversed(face)) for face in f],'concrete',smooth=True);cylinder(x,4.05,0,.5,.025,'dark',32)
 building(0,2,2,1,1.1)
 scope('military',(7,0,3.4))
 for x in [-1,1]:building(x,0,1.5,2,1,'green-dark');roof(x,2.33,0,1.7,.3,2.2,'green')
 vehicle(-1,1.8,'green-dark');vehicle(1,1.8,'green-dark');machine(0,1.3,1,.4)
 scope('relief',(1.5,0,-6.4));building(0,0,2.6,1.5,1.8,'rock-dark')
 for x in [-.8,-.2,.4]:sphere(x,2.8,.55,.35,'orange',sy=2,n=7,rings=4);sphere(x+.1,2.45,.6,.3,'coral',sy=1.4,n=7,rings=4)
 for x in [-1,1]:vehicle(x,1.8,'red')
 scope('train',(-2.6,0,10.6));train()
 scope('oil-rig',(16,0,4.6));oilrig()
 scope('container',(-16,-.1,-.8),rotation=-.4);ship()
 scope('navy',(5,-.1,14.7),rotation=-.6);ship('navy')
 scope('submarine',(-5,-.1,15),rotation=-.65)
 sphere(0,.15,0,.65,'dark',sz=4,sy=.7,rings=10,n=16);box(0,.78,-.4,.5,.7,.95,'steel');beam((0,1,-.4),(0,1.55,-.4),.07,'dark');box(0,.38,-1.9,2,.065,.5,'steel')
 scope('antarctic',(-13.5,0,-12.5));rounded_slab(5.8,4.8,1.5,-.1,1.3,'ice');rounded_slab(5.85,4.85,.3,.79,1.3,'snow')
 mountain(-1.3,-.8)
 for x in [-.4,1.2]:building(x,.8,1.1,1.2,.8,'coral',y=.96);roof(x,1.78,.8,1.25,.2,1.35,'snow')
 beam((1.5,1, -.9),(1.5,3.2,-.9),.07,'steel');sphere(1.5,3.2,-.9,.35,'white',n=12,rings=6)
 scope('deep-sea',(-15,-1,10));cylinder(0,-.25,0,3,.2,'sand',24);sphere(0,.15,0,1.25,'ice',sy=.45,rings=8,n=16)
 for x in [-1.4,1.4]:sphere(x,.2,0,.6,'chalk',sz=1.8,sy=.7);box(x,.4,.6,.65,.22,.06,'glass-dark')
 beam((-1,.2,0),(1,.2,0),.25,'steel');cylinder(0,.9,0,.16,1.3,'silver');sphere(0,1.55,0,.23,'glass')
 scope('plane',(-14,8.5,-4.7),rotation=.8);airplane()
 scope('station',(2.6,13.5,-12),rotation=-.3);station()
 scope('moon',(-7.5,12.5,-16));sphere(0,0,0,1.65,'moon',rings=32,n=64)
 scope('mars',(11,16.5,-15));sphere(0,0,0,1.25,'mars',rings=32,n=64)

def interior(kind):
 # Real cutaway vignettes, loaded separately from the world on demand.
 scope('room')
 floor='wood' if kind=='school' else 'silver'
 box(0,-.12,0,8,.24,6,floor)
 box(0,1.65,-2.95,8,3.3,.13,'chalk')
 box(-3.95,1.65,0,.13,3.3,6,'white')
 # Back wall windows, framing and a low rear sill.
 for x in [-2.7,0,2.7]:
  box(x,2,-2.86,2.3,1.35,.035,'glass-light' if kind!='station' else 'navy')
  box(x,2,-2.82,.045,1.35,.03,'white')
  box(x,2,-2.8,2.3,.04,.03,'white')
  for X in [x-1.175,x+1.175]:box(X,2,-2.79,.045,1.42,.11,'steel')
  for Y in [1.31,2.69]:box(x,Y,-2.79,2.4,.045,.11,'steel')
 box(0,1.17,-2.75,7.8,.06,.36,'wood')
 # Preparation bench, backsplash, handles and sinks.
 box(-2.5,.54,-1.65,2.45,1.08,1.1,'chalk')
 box(-2.5,1.13,-1.65,2.55,.09,1.18,'silver')
 for x in [-3.3,-2.5,-1.7]:
  box(x,.55,-1.075,.72,.92,.025,'white');box(x,.84,-1.05,.32,.035,.025,'steel')
 cylinder(-2.5,1.2,-1.65,.32,.035,'dark',24)
 beam((-2.5,1.14,-2),(-2.5,1.6,-2),.045,'silver');beam((-2.5,1.6,-2),(-2.5,1.6,-1.7),.045,'silver')
 machine(.05,.06,-1.6,1.3)
 box(2.5,.56,-1.65,2,1.12,1.1,'steel');box(2.5,1.16,-1.65,2.12,.08,1.2,'silver')
 for x in [2,2.6,3.2]:
  cylinder(x,1.25,-1.45,.2,.08,'white',20);sphere(x,1.32,-1.45,.12,random.choice(['green','orange','red']),sy=.5,rings=5,n=10)
 # Overhead shelves, bowls, herbs and utensils.
 box(-2.55,2.8,-2.2,2.55,.09,.5,'wood')
 for x in [-3.3,-2.8,-2.3]:
  cylinder(x,2.92,-2.2,.14,.18,'white',16)
 cylinder(-1.7,2.96,-2.2,.13,.22,'terracotta',24,top=.15)
 for i in range(10):
  t=i*2.4;tip=(-1.7+math.cos(t)*.14,3.2+i*.012,-2.2+math.sin(t)*.14)
  beam((-1.7,3.03,-2.2),tip,.012,'green')
  foliage(*tip,.16,.12,t,.6)
 for x in [1.6,1.85,2.1]:beam((x,2.5,-2.75),(x,2.12,-2.75),.045,'wood');sphere(x,2.07,-2.74,.085,'wood',sz=.4,rings=5,n=8)
 # Communal dining table, stools and place settings in foreground.
 box(.45,.95,1.4,4.9,.14,1.25,'wood')
 for x in [-1.65,2.55]:
  for z in [.97,1.83]:box(x,.46,z,.1,.92,.1,'steel')
 for x in [-1.1,.35,1.8]:
  for z in [.35,2.45]:
   cylinder(x,.6,z,.29,.13,'coral' if kind=='school' else 'dark',16)
   for xx in [-.16,.16]:box(x+xx,.28,z,.05,.54,.05,'steel')
  cylinder(x,1.045,1.45,.25,.035,'white',24);cylinder(x+.39,1.13,1.6,.08,.19,'glass',12)
 # Environment cues outside each cutaway.
 if kind=='school':
  for x in [-6.5,6.4]:tree(x,-1.8,2.8,y=-.25)
  box(0,-.32,0,10.5,.15,8,'grass');roof(-3.95,3.37,0,.22,.1,6,'terracotta')
  for i in range(4):box(-3.85,1.7,.9+i*.28,.02,.65,.2,random.choice(['coral','orange','blue']))
 elif kind=='oil-rig':
  box(0,-.42,0,9,.4,7,'orange')
  for x in [-4.4,4.4]:
   for z in [-3.4,3.4]:cylinder(x,-2,z,.28,3,'steel',12)
  for z in [-3.4,3.4]:
   beam((-4.4,.5,z),(4.4,.5,z),.055,'yellow')
   for x in [-4.4,-2,0,2,4.4]:beam((x,-.2,z),(x,.5,z),.05,'yellow')
 else:
  box(0,-.32,0,8.5,.18,6.5,'white')
  for x in [-3.8,-2,0,2,3.8]:
   box(x,1.65,-2.78,.07,3.3,.09,'silver')
  for x in [-5.6,5.6]:solar(x,-.1,0,2.3,6)
  # Star-like observation windows remain part of the actual orbital room.
  for x in [-2.7,0,2.7]:
   for i in range(9):sphere(x+random.uniform(-1,1),random.uniform(1.5,2.5),-2.79,.02,'white',rings=3,n=5)

def export(name):
 print('GI: preparing', name, len(parts), 'mesh batches', flush=True)
 for (dest,mat),(vs,fs,uvs,smooth) in parts.items():
  me=bpy.data.meshes.new(dest+'_'+mat);me.from_pydata(vs,[],fs);me.materials.append(MATERIALS[mat]);me.update()
  uv=me.uv_layers.new(name='UVMap')
  scale=.25 if mat in ['grass','rock','rock-dark'] else (.65 if mat in ['wood','trunk'] else 1)
  for face in me.polygons:
   face.use_smooth=smooth[face.index]
   normal=face.normal;major=max(range(3),key=lambda i:abs(normal[i]));axes=[i for i in range(3) if i!=major]
   for j,loop in enumerate(face.loop_indices):
    v=me.vertices[me.loops[loop].vertex_index].co
    if uvs[face.index]:coord=uvs[face.index][j]
    elif mat in ['moon','mars']:
     center=Vector((-7.5,16,12.5) if mat=='moon' else (11,15,16.5));q=(v-center).normalized()
     coord=(.5+math.atan2(-q.y,q.x)/math.tau,.5+math.asin(max(-1,min(1,q.z)))/math.pi)
    else:coord=(v[axes[0]]*scale,v[axes[1]]*scale)
    uv.data[loop].uv=coord
   if mat in ['moon','mars']:
    longitude=[uv.data[loop].uv.x for loop in face.loop_indices]
    if max(longitude)-min(longitude)>.5:
     for loop in face.loop_indices:
      if uv.data[loop].uv.x<.5:uv.data[loop].uv.x+=1
  ob=bpy.data.objects.new(dest+'__'+mat,me);bpy.context.collection.objects.link(ob);ob['destination']=dest
  assert not me.validate(verbose=False), 'Invalid mesh in '+dest+' '+mat
  # Micro-bevels catch light on industrial/architectural edges. Never bevel
  # foliage cards, smooth terrain or globes; keep export size predictable.
  if mat in ['white','silver','steel','dark','glass-dark','wood','orange','blue','red']:
   bevel=ob.modifiers.new('Fabricated edge radii','BEVEL');bevel.width=.008;bevel.segments=2;bevel.limit_method='ANGLE';bevel.angle_limit=.65
   bpy.context.view_layer.objects.active=ob
   bpy.ops.object.modifier_apply(modifier=bevel.name)
 print('GI: exporting', name, flush=True)
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name+'.glb'),export_format='GLB',export_extras=True,export_yup=True,export_cameras=False,export_lights=False,export_animations=False,export_image_quality=80,export_meshopt_compression_enable=True)
 print('EXPORTED',name,len(parts),'batches',sum(len(p[0]) for p in parts.values()),'vertices')
 if name == 'vision-world':
  source_dir=os.path.abspath(os.path.join(OUT,'../../models'))
  os.makedirs(source_dir,exist_ok=True)
  # A render-ready, editable native scene, independent of the open GUI file.
  scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=True
  scene.render.resolution_x=1600;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
  scene.world=bpy.data.worlds.new('Daylight studio');scene.world.use_nodes=True
  env=scene.world.node_tree.nodes.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(os.path.join(TEXTURE_DIR,'daylight.hdr'),check_existing=True)
  background=scene.world.node_tree.nodes.get('Background');background.inputs['Strength'].default_value=.7
  scene.world.node_tree.links.new(env.outputs['Color'],background.inputs['Color'])
  light=bpy.data.lights.new('Late morning sun','SUN');light.energy=2.7;light.angle=.1;light.color=(1,.94,.86)
  sun=bpy.data.objects.new('Late morning sun',light);scene.collection.objects.link(sun);sun.location=(-18,-16,35)
  sun.rotation_euler=(Vector((0,0,0))-sun.location).to_track_quat('-Z','Y').to_euler()
  camdata=bpy.data.cameras.new('World presentation');camera=bpy.data.objects.new('World presentation',camdata);scene.collection.objects.link(camera)
  camera.location=(38,-43,30);camera.rotation_euler=(Vector((0,0,4))-camera.location).to_track_quat('-Z','Y').to_euler();camdata.lens=48;scene.camera=camera
  bpy.ops.mesh.primitive_plane_add(size=400,location=(0,0,-.08));sea=bpy.context.object;sea.name='Sea — native render only'
  water=bpy.data.materials.new('Native daylight water');bs=water.node_tree.nodes.get('Principled BSDF')
  bs.inputs['Base Color'].default_value=(.14,.37,.43,1);bs.inputs['Roughness'].default_value=.27;bs.inputs['Metallic'].default_value=.12
  noise=water.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=170
  bump=water.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.2;bump.inputs['Distance'].default_value=.04
  water.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);water.node_tree.links.new(bump.outputs['Normal'],bs.inputs['Normal']);sea.data.materials.append(water)
  bpy.ops.file.pack_all()
  bpy.ops.wm.save_as_mainfile(filepath=os.path.join(source_dir,'gi-vision-world.blend'),check_existing=False)
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);parts.clear()

world();export('vision-world')
for kind in ['school','oil-rig','station']:
 interior(kind);export('interior-'+kind)
