import {
  AmbientLight,
  BoxGeometry,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  OneHandGrabbable,
  RayInteractable,
  SessionMode,
  SphereGeometry,
  Vector3,
  World,
} from "@iwsdk/core";
import type {CareerNode,SceneAction,Vec3} from "../types";

type Edge={from:string;to:string;mesh:any};

const STORAGE_KEY="skillspace-node-layout-v1";

export class SkillSpaceWorld {
  world!: any;
  objects = new Map<string, any>();
  originals = new Map<string, Vec3>();
  selectedId: string | null = null;
  onSelect?: (nodeId: string) => void;
  private edges:Edge[]=[];
  private raf=0;
  private edgeMaterial=new MeshStandardMaterial({color:0x475569,roughness:0.8,metalness:0});
  private savedLayout:Record<string,Vec3>={};

  async init(container: HTMLElement, nodes: CareerNode[], onSelect?: (nodeId: string) => void) {
    this.onSelect = onSelect;
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
      this.saveLayout();
      this.raf=requestAnimationFrame(tick);
    };
    this.raf=requestAnimationFrame(tick);
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
    this.saveLayout();
    for(const edge of this.edges){
      edge.mesh.geometry?.dispose?.();
    }
    this.edgeMaterial.dispose();
    this.world?.dispose?.();
  }
}
