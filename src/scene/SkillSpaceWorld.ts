import {
  AmbientLight,
  BoxGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  OneHandGrabbable,
  RayInteractable,
  SessionMode,
  SphereGeometry,
  World,
} from "@iwsdk/core";
import type {CareerNode,SceneAction,Vec3} from "../types";

export class SkillSpaceWorld {
  world!: any;
  objects = new Map<string, any>();
  originals = new Map<string, Vec3>();
  selectedId: string | null = null;
  onSelect?: (nodeId: string) => void;

  async init(container: HTMLElement, nodes: CareerNode[], onSelect?: (nodeId: string) => void) {
    this.onSelect = onSelect;
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
    group.position.set(...node.position);

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
    const role=this.objects.get("role-data-analyst");
    if(role)role.object3D.position.set(0,1.65,-2.2);

    const layout:Record<string,Vec3>={
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
  }

  apply(action: SceneAction) {
    if(action.type==="FOCUS_NODE"&&action.nodeId)this.focus(action.nodeId);
    if(action.type==="SHOW_SKILL"&&action.nodeId)this.focus(action.nodeId);
    if(action.type==="MOVE_NODE"&&action.nodeId&&action.position)this.move(action.nodeId,action.position);
    if(action.type==="ARRANGE_PATH")this.arrangePath();
    if(action.type==="RESET_SCENE")this.reset();
  }

  dispose() {
    this.world?.dispose?.();
  }
}
