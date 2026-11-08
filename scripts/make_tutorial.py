"""Render an annotated Vietnamese animated walkthrough, not a screen recording."""
from PIL import Image, ImageDraw, ImageFont
import math, subprocess, pathlib, wave, struct

ROOT=pathlib.Path(__file__).resolve().parent.parent
OUT=ROOT/'public/media';OUT.mkdir(parents=True,exist_ok=True)
W,H,FPS=1280,720,15
F='/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf'
B='/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf'
fonts={}
def font(n,b=False):
 key=(n,b)
 if key not in fonts:fonts[key]=ImageFont.truetype(B if b else F,n)
 return fonts[key]
MINT='#bce9cc';GOLD='#e9c78e';DIM='#a4b7c8';PURPLE='#c5a2f8'
chapters=[
 (0,8,'VÀO GAME','Chơi thử trước nhé!', ['Mở bản ARCANA PLAY.','Chọn “Luyện với máy”.','Đọc hướng dẫn rồi vào trận.'],'Không cần tài khoản để luyện với máy.'),
 (8,18,'CHỌN TƯỚNG','Chọn một người hùng.', ['Bấm thẻ tướng ở sảnh.','Ví dụ: Luna — Pháp sư.','Mỗi vai trò có sức mạnh riêng.'],'Đội online không được chọn trùng tướng.'),
 (18,33,'CAMERA TỰ DO','Xoay nhìn quanh bạn.', ['Giữ chuột, kéo trên nền sân.','Cuộn chuột để gần hoặc xa.','Nhấn C: về sau lưng.'],'Điện thoại: vuốt nền sân; chụm 2 ngón để zoom.'),
 (33,43,'DI CHUYỂN','Nhìn đâu, tiến về đó.', ['W / ↑: tiến theo góc nhìn.','S / ↓: lùi; A / D: sang ngang.','Xoay camera rồi thử đi tiếp.'],'Điện thoại: giữ nút hướng ở góc trái.'),
 (43,55,'CHIẾN ĐẤU','Đến gần rồi ra đòn.', ['Space: đánh thường.','Q: kỹ năng 1; E: kỹ năng 2.','Chờ hết số đếm để dùng lại.'],'Đòn đánh tự tìm đối thủ trong tầm.'),
 (55,70,'TRI THỨC','Đúng một câu, thêm sức mạnh.', ['Chết / lên cấp mới có câu hỏi.','Đúng: nhận 100–150 điểm.','Chiêu cuối mở khóa: nhấn R!'],'Có 10 giây trả lời. Sai vẫn hồi sinh, không bị trừ điểm.'),
 (70,80,'HỒI PHỤC','Đừng quên giữ máu.', ['Về gần cổng đội mình để hồi.','Hết máu: chờ hồi sinh 10 giây.','Đi cùng đồng đội để dễ thắng.'],'Điểm trận: 50% chiến đấu + 50% tri thức.'),
 (80,90,'PHÒNG LỚP HỌC','Sẵn sàng cùng đồng đội!', ['Quét QR hoặc mở link của MC.','Nhập biệt danh và chọn đội.','Chờ MC duyệt rồi vào trận.'],'Mở link người chơi, nhập biệt danh và mã phòng của MC.')]

def rr(d,box,fill,outline=None,r=14,width=1):d.rounded_rectangle(box,radius=r,fill=fill,outline=outline,width=width)
def text(d,xy,s,size=24,color='white',bold=False):d.text(xy,s,font=font(size,bold),fill=color)
def wrap(d,s,width,size,bold=False):
 words=s.split();lines=[];line=''
 for word in words:
  test=(line+' '+word).strip()
  if d.textlength(test,font=font(size,bold))>width and line:lines.append(line);line=word
  else:line=test
 if line:lines.append(line)
 return lines
def cursor(d,x,y,click=False):
 if click:d.ellipse((x-22,y-22,x+22,y+22),outline=MINT,width=3)
 d.polygon([(x,y),(x+4,y+28),(x+11,y+19),(x+25,y+18)],fill='white',outline='#122434',width=2)
def key(d,x,y,label,on=False,w=56):
 rr(d,(x,y,x+w,y+47),MINT if on else '#263d4d','#a4c9ba' if on else '#547080',8,2)
 tw=d.textlength(label,font=font(16,True));text(d,(x+(w-tw)/2,y+10),label,16,'#17352e' if on else '#e7f1e9',True)
def scene(d,t,step):
 x0,y0=430,155;vw,vh=810,460
 rr(d,(x0,y0,x0+vw,y0+vh),'#263a50','#425e70',18)
 # Orbit projection around an example character; same axes as the game camera.
 yaw=-math.pi/2
 if step==2:
  u=t-18
  yaw=-math.pi/2+(math.sin(min(u,11)/11*math.pi*1.4)*1.8 if u<11 else 0)
 if step==3:yaw=-math.pi/2+max(0,t-38)*.22
 distance=15+(math.sin((t-18)*.6)*3 if step==2 and t<29 else 0)
 pitch=.57;focusx= -3+max(0,min(7,t-33))*.5 if step==3 else 0
 camera=(focusx+math.sin(yaw)*distance,1.5+math.sin(pitch)*distance,math.cos(yaw)*distance)
 target=(focusx,1.3,0)
 def norm(v):
  l=math.sqrt(sum(x*x for x in v));return tuple(x/l for x in v)
 def cross(a,b):return(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
 f=norm(tuple(target[i]-camera[i] for i in range(3)));r=norm(cross(f,(0,1,0)));up=cross(r,f)
 def proj(p):
  delta=tuple(p[i]-camera[i] for i in range(3));z=sum(delta[i]*f[i] for i in range(3));z=max(.1,z)
  return(x0+vw/2+sum(delta[i]*r[i] for i in range(3))/z*485,y0+vh/2-sum(delta[i]*up[i] for i in range(3))/z*485,z)
 polys=[]
 def poly(points,color):
  pts=[proj(p) for p in points]
  if all(p[2]>.5 for p in pts):polys.append((sum(p[2] for p in pts)/len(pts),[(p[0],p[1]) for p in pts],color))
 # Only draw polygons contained in a separate layer to keep the instruction panel clean.
 layer=Image.new('RGBA',(W,H));ld=ImageDraw.Draw(layer)
 poly([(-14,-.2,-6),(14,-.2,-6),(14,-.2,6),(-14,-.2,6)],'#4f7f75')
 for x in range(-12,14,2):
  for z in range(-4,6,2):poly([(x,0,z),(x+1.93,0,z),(x+1.93,0,z+1.93),(x,0,z+1.93)],'#a2a8b2' if (x+z)%4 else '#bac0c5')
 for x in [-13,13]:
  for z in [-4,4]:
   poly([(x-.6,0,z-.6),(x+.6,0,z-.6),(x+.6,4,z-.6),(x-.6,4,z-.6)],'#9294ad')
   poly([(x+.6,0,z-.6),(x+.6,0,z+.6),(x+.6,4,z+.6),(x+.6,4,z-.6)],'#727e95')
   poly([(x-.9,4,z-.9),(x+.9,4,z-.9),(x,6,z)],'#a7e4cd' if x<0 else '#c19dea')
 for x in range(-11,13,4):
  for z in [-6,6]:poly([(x-1.3,0,z),(x+1.3,0,z),(x,4,z)],'#417b77')
 for depth,pts,c in sorted(polys,reverse=True):ld.polygon(pts,fill=c)
 # Character bodies are billboards anchored in the projected 3D world.
 chars=[(focusx,0,'#b99bef','Bạn'),(5,1.5,'#efa590','Đối thủ'),(-2,-2,'#8fddc3','Đồng đội')]
 for px,pz,c,name in sorted(chars,key=lambda a:proj((a[0],1,a[1]))[2],reverse=True):
  sx,sy,depth=proj((px,0,pz));scale=min(1.8,11/depth);sz=30*scale
  if step==6 and name=='Bạn' and t<77:continue
  ld.ellipse((sx-sz*.8,sy-sz*.12,sx+sz*.8,sy+sz*.25),fill='#2a4f58')
  ld.polygon([(sx-sz*.35,sy-sz*1.8),(sx+sz*.35,sy-sz*1.8),(sx+sz*.65,sy),(sx-sz*.65,sy)],fill=c)
  ld.ellipse((sx-sz*.55,sy-sz*3,sx+sz*.55,sy-sz*1.8),fill='#ffe3cc')
  ld.polygon([(sx-sz*.75,sy-sz*2.9),(sx+sz*.75,sy-sz*2.9),(sx,sy-sz*4.05)],fill=c)
  ld.ellipse((sx-sz*.85,sy-sz*3.05,sx+sz*.85,sy-sz*2.8),fill=c)
  ld.line((sx+sz*.75,sy,sx+sz*.75,sy-sz*2.3),fill='#e3cfac',width=3)
  ld.ellipse((sx+sz*.6,sy-sz*2.7,sx+sz*.9,sy-sz*2.3),fill=c)
  ld.line((sx-sz,sy-sz*4.4,sx+sz,sy-sz*4.4),fill=MINT if name!='Đối thủ' else PURPLE,width=4)
  ld.text((sx-sz,sy+8),name,font=font(14,True),fill='white')
 if step==4 and int(t*2)%3==0:
  a=proj((focusx,1.2,0));b=proj((5,1.2,1.5));ld.line((a[0],a[1],b[0],b[1]),fill='#ffe29d',width=5)
 crop=layer.crop((x0,y0,x0+vw,y0+vh));image.paste(crop,(x0,y0),crop)
 # Minimal HUD indicates where to find controls in the playable version.
 rr(d,(x0+165,y0+12,x0+645,y0+63),'#142a37','#587486',9)
 text(d,(x0+184,y0+24),'Hỏa Phượng',14,MINT,True);text(d,(x0+362,y0+22),'02:38',20,'white',True);text(d,(x0+508,y0+24),'Nguyệt Ảnh',14,PURPLE,True)
 for i,k in enumerate(['SPACE','Q','E','R']):key(d,x0+243+i*74,y0+vh-66,k,on=step==4 and i==int((t-43)/3)%3 or step==5 and t>65 and i==3,w=66)
 if step==2:
  u=t-18;cx=x0+420+math.sin(u*.6)*110;cy=y0+200+math.cos(u*.6)*25;cursor(d,cx,cy,True)
  rr(d,(x0+18,y0+80,x0+224,y0+122),'#152c3a','#bce9cc',8);text(d,(x0+32,y0+90),'Camera tự do · V',15,MINT,True)
  if u>11:key(d,x0+25,y0+133,'C',True);text(d,(x0+89,y0+146),'Về sau lưng',14,MINT)
 if step==3:
  for i,(k,dx,dy) in enumerate([('W',1,0),('A',0,1),('S',1,1),('D',2,1)]):key(d,x0+20+dx*52,y0+285+dy*49,k,k=='W',46)
 if step==5:
  u=t-55;bx=x0+142;by=y0+95
  rr(d,(bx,by,bx+530,by+230),'#152d40','#e9c78e',12,2)
  text(d,(bx+20,by+17),'THỬ THÁCH TRI THỨC',16,GOLD,True)
  text(d,(bx+462,by+17),f'{max(0,10-int(u))}s',18,GOLD,True)
  text(d,(bx+20,by+62),'Không cung cấp mã OTP cho người lạ.',19,'white',True)
  rr(d,(bx+20,by+112,bx+255,by+157),'#365b52',MINT,7);text(d,(bx+105,by+122),'Đúng',18,MINT,True)
  rr(d,(bx+273,by+112,bx+510,by+157),'#453a4c','#b998b7',7);text(d,(bx+370,by+122),'Sai',18,'#e7c7d4',True)
  if u>3:cursor(d,bx+180,by+135,u<5);text(d,(bx+20,by+180),'CHÍNH XÁC! +135 điểm · Đã mở chiêu cuối',16,MINT,True)
 if step==6 and t<77:
  rr(d,(x0+250,y0+150,x0+560,y0+280),'#142a3b','#e9c78e',12)
  text(d,(x0+295,y0+171),'ĐANG HỒI SINH',18,GOLD,True);text(d,(x0+386,y0+205),str(max(1,10-int(t-70))),40,GOLD,True)

# A gentle original sine arpeggio, no speech; instructions are burned into the picture.
audio=OUT/'tutorial-music.wav'
with wave.open(str(audio),'wb') as wav:
 wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(22050)
 data=bytearray();notes=[261.63,329.63,392,493.88,440,392,329.63,293.66]
 for i in range(90*22050):
  t=i/22050;beat=t%.8;env=math.exp(-beat*5)*min(1,t/2,(90-t)/2);hz=notes[int(t/.8)%8]
  value=.045*env*(math.sin(2*math.pi*hz*t)+.2*math.sin(2*math.pi*hz*2*t))
  data+=struct.pack('<h',int(value*32767))
 wav.writeframes(data)
cmd=['ffmpeg','-y','-loglevel','error','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s','1280x720','-r',str(FPS),'-i','-','-i',str(audio),'-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','64k','-shortest','-movflags','+faststart',str(OUT/'huong-dan-arcana.mp4')]
process=subprocess.Popen(cmd,stdin=subprocess.PIPE)
for frame in range(90*FPS):
 t=frame/FPS;step=next(i for i,c in enumerate(chapters) if c[0]<=t<c[1]);start,end,tag,title,lines,note=chapters[step]
 image=Image.new('RGB',(W,H),'#101f30');d=ImageDraw.Draw(image)
 text(d,(40,24),'ARCANA / PLAY',19,MINT,True);text(d,(430,27),'VIDEO MINH HỌA THAO TÁC • CHỮ TIẾNG VIỆT',13,DIM)
 text(d,(1160,25),f'{int(t):02d} / 90s',14,DIM)
 d.line((40,67,1240,67),fill='#365065',width=1)
 text(d,(40,105),f'{step+1:02d}  /  {len(chapters):02d}',17,GOLD,True);text(d,(40,146),tag,14,MINT,True)
 yy=187
 for l in wrap(d,title,345,34,True):text(d,(40,yy),l,34,'#f2f2e9',True);yy+=47
 yy+=25
 for i,line in enumerate(lines):
  active=min(2,int((t-start)/(end-start)*3))>=i
  text(d,(40,yy),str(i+1).zfill(2),14,MINT if active else '#647d8e',True)
  for l in wrap(d,line,298,19):text(d,(74,yy-3),l,19,'#dbe8e5' if active else '#718b9b');yy+=31
  yy+=15
 scene(d,t,step)
 if step in [0,1,7]:
  x,y=585,275;rr(d,(x,y,1110,y+190),'#142b3b','#b4d9c2',14,2)
  if step==0:
   text(d,(x+28,y+23),'ARCANA PLAY',25,MINT,True);rr(d,(x+28,y+82,x+240,y+136),MINT,None,8);text(d,(x+48,y+96),'Luyện với máy →',19,'#183b31',True);cursor(d,x+170,y+110,t-start>3)
  elif step==1:
   for j,(name,c) in enumerate([('Sol','#efc581'),('Luna','#bda1f5'),('Ivy','#a4e2bb')]):
    xx=x+32+j*160;rr(d,(xx,y+20,xx+140,y+162),'#263b50',MINT if j==1 else '#526e82',10,3 if j==1 else 1);d.polygon([(xx+28,y+83),(xx+112,y+83),(xx+70,y+30)],fill=c);d.ellipse((xx+48,y+80,xx+92,y+126),fill='#ffe1c5');text(d,(xx+43,y+129),name,17,MINT if j==1 else 'white',True)
   cursor(d,x+260,y+129,t-start>3)
  else:
   text(d,(x+26,y+20),'Vào phòng lớp học',24,MINT,True);text(d,(x+26,y+68),'Mã phòng:  • • • • • •',22,'white',True);text(d,(x+26,y+112),'Chọn đội → Chờ MC duyệt',20,GOLD,True)
 rr(d,(40,635,1240,690),'#203746',None,10)
 for i,line in enumerate(wrap(d,note,1140,18)):text(d,(62,648+i*22),line,18,MINT)
 d.rectangle((40,707,1240,712),fill='#31495a');d.rectangle((40,707,40+1200*t/90,712),fill=MINT)
 if frame in [30,345,600,900,1290]:None
 process.stdin.write(image.tobytes())
 if frame%(FPS*10)==0:print(f'Rendered {frame/FPS:.0f}/90s',flush=True)
process.stdin.close();assert process.wait()==0
audio.unlink()
print(OUT/'huong-dan-arcana.mp4',flush=True)
