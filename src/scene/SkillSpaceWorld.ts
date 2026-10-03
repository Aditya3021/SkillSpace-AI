import {
  AmbientLight,
  BoxGeometry,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OneHandGrabbable,
  PlaneGeometry,
  RayInteractable,
  SessionMode,
  SphereGeometry,
  Vector3,
  World,
} from "@iwsdk/core";
import {CanvasTexture as ThreeCanvasTexture} from "three";
import type {CareerNode,SceneAction,Vec3} from "../types";

type Edge={from:string;to:string;mesh:any};

const STORAGE_KEY="skillspace-node-layout-v1";

export class SkillSpaceWorld {
  world!: any;
  objects = new Map<string, any>();
  originals = new Map<string, Vec3>();
  selectedId: string | null = null;
  onSelect?: (nodeId: string) => void;
  onCopilotTap?: () => void;
  private edges:Edge[]=[];
  private raf=0;
  private saveTimer=0;
  private edgeMaterial=new MeshStandardMaterial({color:0x475569,roughness:0.8,metalness:0});
  private savedLayout:Record<string,Vec3>={};
  private copilotCanvas:HTMLCanvasElement|null=null;
  private copilotTexture:any=null;
  private copilotMesh:any=null;

  async init(
    container: HTMLElement,
    nodes: CareerNode[],
    onSelect?: (nodeId: string) => void,
    onCopilotTap?: () => void,
  ) {
    this.onSelect = onSelect;
    this.onCopilotTap = onCopilotTap;
    this.savedLayout=this.readLayout();
    this.world = await World.create(container, {
      xr: {
        sessionMode: SessionMode.ImmersiveVR,
        features: {handTracking: true},
      },
      input: {canvasPointerEvents: true},
      features: {
        grabbing: {useHandPinchForGrab: true},
        locomotion: false,
      },
    });

    this.world.createTransformEntity(new AmbientLight(0xffffff, 1.5));
    const key = this.world.createTransformEntity(new DirectionalLight(0xffffff, 2));
    key.object3D.position.set(2, 4, 2);

    for (const node of nodes) this.addNode(node);
    this.createEdges(nodes);
    this.createCopilotPanel();
    this.startEdgeLoop();
  }

  async enterXR() {
    if (!this.world) return false;
    try {
      await this.world.launchXR();
      return true;
    } catch (error) {
      console.warn("Unable to enter immersive VR", error);
      return false;
    }
  }

  async exitXR() {
    await this.world?.exitXR?.();
  }

  isXRActive() {
    return this.world?.visibilityState?.value === "visible";
  }

  private readLayout():Record<string,Vec3>{
    try {
      const raw=localStorage.getItem(STORAGE_KEY);
      if(!raw)return {};
      const parsed=JSON.parse(raw);
      if(!parsed||typeof parsed!=="object")return {};
      return parsed as Record<string,Vec3>;
    } catch {
      return {};
    }
  }

  private saveLayout(){
    const layout:Record<string,Vec3>={};
    for(const [id,entity] of this.objects){
      const p=entity.object3D.position;
      layout[id]=[p.x,p.y,p.z];
    }
    try { localStorage.setItem(STORAGE_KEY,JSON.stringify(layout)); } catch {}
  }

  private createEdges(nodes:CareerNode[]){
    const nodeIds=new Set(nodes.map(node=>node.id));
    for(const node of nodes){
      for(const prerequisite of node.prerequisites){
        if(!nodeIds.has(prerequisite))continue;
        const mesh=new Mesh(new CylinderGeometry(0.018,0.018,1,8),this.edgeMaterial);
        mesh.userData.nonInteractive=true;
        this.world.createTransformEntity(mesh);
        this.edges.push({from:prerequisite,to:node.id,mesh});
      }
    }
  }

  private createCopilotPanel(){
    const canvas=document.createElement("canvas");
    canvas.width=880;
    canvas.height=500;
    this.copilotCanvas=canvas;
    this.copilotTexture=new ThreeCanvasTexture(canvas);
    this.copilotTexture.colorSpace="srgb";

    const panel=new Mesh(
      new PlaneGeometry(2.2,1.25),
      new MeshBasicMaterial({
        map:this.copilotTexture,
        transparent:true,
        depthWrite:false,
      }),
    );
    panel.userData.nonInteractive=false;
    (panel as any).onClick=()=>this.onCopilotTap?.();

    const entity=this.world.createTransformEntity(panel);
    entity.object3D.position.set(0,1.55,-1.55);
    entity.addComponent(RayInteractable);
    this.copilotMesh=entity;
    this.setCopilot("DATA ANALYST","Ready for a scene command.",false);
  }

  setCopilot(title:string,status:string,listening:boolean){
    const canvas=this.copilotCanvas;
    const texture=this.copilotTexture;
    if(!canvas||!texture)return;
    const ctx=canvas.getContext("2d");
    if(!ctx)return;

    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#080d1d";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle=listening?"#22c55e":"#33405f";
    ctx.lineWidth=4;
    ctx.strokeRect(8,8,canvas.width-16,canvas.height-16);

    ctx.fillStyle="#8d98b8";
    ctx.font="700 22px Inter, system-ui, sans-serif";
    ctx.fillText("AI COPILOT",40,55);

    ctx.fillStyle=listening?"#22c55e":"#7c5cff";
    ctx.beginPath();
    ctx.arc(790,48,13,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle="#eef2ff";
    ctx.font="700 38px Inter, system-ui, sans-serif";
    ctx.fillText(title.slice(0,24),40,115);

    ctx.fillStyle="#aeb8d2";
    ctx.font="24px Inter, system-ui, sans-serif";
    const words=status.split(" ");
    let line="";
    let y=165;
    for(const word of words){
      const next=line?line+" "+word:word;
      if(ctx.measureText(next).width>760){
        ctx.fillText(line,40,y);
        y+=34;
        line=word;
      }else line=next;
    }
    if(line)ctx.fillText(line,40,y);

    ctx.fillStyle="#64708f";
    ctx.font="600 20px Inter, system-ui, sans-serif";
    ctx.fillText(listening?"LISTENING • SAY A COMMAND":"PINCH / CLICK PANEL TO TALK",40,430);

    texture.needsUpdate=true;
  }

  private updateEdges(){
    const up=new Vector3(0,1,0);
    const direction=new Vector3();
    for(const edge of this.edges){
      const a=this.objects.get(edge.from)?.object3D.position;
      const b=this.objects.get(edge.to)?.object3D.position;
      if(!a||!b)continue;
      direction.set(b.x-a.x,b.y-a.y,b.z-a.z);
      const length=direction.length();
      if(length<0.001)continue;
      direction.normalize();
      edge.mesh.position.set((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);
      edge.mesh.quaternion.setFromUnitVectors(up,direction);
      edge.mesh.scale.set(1,length,1);
    }
  }

  private startEdgeLoop(){
    const tick=()=>{
      this.updateEdges();
      this.raf=requestAnimationFrame(tick);
    };
    this.raf=requestAnimationFrame(tick);
    this.saveTimer=window.setInterval(()=>this.saveLayout(),1000);
  }

  addNode(node: CareerNode) {
    const group = new Group();
    const geometry =
      node.kind === "role"
        ? new BoxGeometry(1.5, 0.58, 0.18)
        : new SphereGeometry(0.34, 32, 20);

    const material = new MeshStandardMaterial({
      color:
        node.kind === "role"
          ? 0x7c5cff
          : node.progress > 40
            ? 0x22c55e
            : 0x38bdf8,
      roughness: 0.35,
      metalness: 0.1,
    });

    const mesh = new Mesh(geometry, material);
    mesh.userData.nodeId = node.id;
    (mesh as any).onClick = () => this.onSelect?.(node.id);
    (mesh as any).onPointerEnter = () => {
      if (this.selectedId !== node.id) material.emissive.set(0x1f2937);
    };
    (mesh as any).onPointerLeave = () => {
      if (this.selectedId !== node.id) material.emissive.set(0x000000);
    };

    group.add(mesh);
    const restored=this.savedLayout[node.id]??node.position;
    group.position.set(...restored);

    const entity = this.world.createTransformEntity(group);
    entity
      .addComponent(RayInteractable)
      .addComponent(OneHandGrabbable, {
        rotate: false,
        translate: true,
      });

    this.objects.set(node.id, entity);
    this.originals.set(node.id, [...node.position]);
    return entity;
  }

  focus(id: string) {
    const entity = this.objects.get(id);
    if (!entity) return;

    this.selectedId = id;
    for (const [key, object] of this.objects) {
      const material = object.object3D.children?.[0]?.material;
      if (material?.color) {
        material.color.set(
          key === id ? 0xfbbf24 : key === "role-data-analyst" ? 0x7c5cff : 0x38bdf8,
        );
        material.emissive?.set?.(0x000000);
      }
    }
  }

  move(id: string, position: Vec3) {
    const entity = this.objects.get(id);
    if (entity) entity.object3D.position.set(...position);
  }

  arrangePath() {
    const layout:Record<string,Vec3>={
      "role-data-analyst":[0,1.65,-2.2],
      "skill-python":[-1.6,1.15,-2.45],
      "skill-sql":[0,1.15,-2.65],
      "skill-excel":[1.6,1.15,-2.45],
      "skill-pandas":[-1.6,0.55,-2.2],
    };
    for(const [id,position] of Object.entries(layout))this.move(id,position);
  }

  reset() {
    for (const [id, position] of this.originals) this.move(id, position);
    this.selectedId = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  apply(action: SceneAction) {
    if(action.type==="FOCUS_NODE"&&action.nodeId)this.focus(action.nodeId);
    if(action.type==="SHOW_SKILL"&&action.nodeId)this.focus(action.nodeId);
    if(action.type==="MOVE_NODE"&&action.nodeId&&action.position)this.move(action.nodeId,action.position);
    if(action.type==="ARRANGE_PATH")this.arrangePath();
    if(action.type==="RESET_SCENE")this.reset();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.clearInterval(this.saveTimer);
    this.saveLayout();
    for(const edge of this.edges){
      edge.mesh.geometry?.dispose?.();
    }
    this.copilotMesh?.object3D?.children?.[0]?.geometry?.dispose?.();
    this.copilotMesh?.object3D?.children?.[0]?.material?.dispose?.();
    this.copilotTexture?.dispose?.();
    this.edgeMaterial.dispose();
    this.world?.dispose?.();
  }
}
