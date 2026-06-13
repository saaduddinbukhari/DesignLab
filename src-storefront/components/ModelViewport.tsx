import { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ModelViewportProps {
  modelUrl: string;
  textureCanvas: HTMLCanvasElement | null;
  packageColor: string;
}

export function ModelViewport({
  modelUrl,
  textureCanvas,
  packageColor,
}: ModelViewportProps) {
  const { scene } = useGLTF(modelUrl);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    if (!textureCanvas) return;
    textureRef.current?.dispose();

    const tex = new THREE.CanvasTexture(textureCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.flipY = false;
    textureRef.current = tex;

    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;

      if (mesh.name.toLowerCase().includes("customcanvas")) {
        // Always create a fresh material — the GLB carries alpha=0 from Blender
        // which would override any property mutation on the existing material.
        mesh.material = new THREE.MeshStandardMaterial({
          map: tex,
          transparent: true,
          opacity: 1.0,
          alphaTest: 0.01,
          color: new THREE.Color(0xffffff),
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
      } else {
        // 1. Get the material that came from Blender
        const mat = mesh.material as THREE.MeshStandardMaterial;
        
        if (mat) {
          // 2. Update the color to the user's choice
          mat.color.set(packageColor);
          
          // 3. Remove the base colormap texture only
          // This leaves normalMap, roughnessMap, clearcoatMap, etc. intact
          mat.map = null;
          mat.needsUpdate = true;
        }
      }
    });
  }, [scene, textureCanvas, packageColor]);

  useFrame(() => {
    if (textureRef.current) textureRef.current.needsUpdate = true;
  });

  return <primitive object={scene} dispose={null} scale={1.5} />;
}