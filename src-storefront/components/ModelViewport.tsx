import { useEffect, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface ModelViewportProps {
  modelUrl: string;
  textureCanvas?: HTMLCanvasElement | null;
  packageColor?: string;
  isAutoRotating?: boolean;
}

/** 💡 UPGRADED SCENE RUNTIME FOR OVERVIEW PANEL: Animates the camera orbit for realistic HDR world movement */
export function StaticScene({ modelUrl, isAutoRotating = false }: { modelUrl: string; isAutoRotating?: boolean }) {
  const { scene } = useGLTF(modelUrl);
  const { camera } = useThree();
  
  // Track the current accumulated orbit angle in radians
  const currentAngleRef = useRef(0);
  
  // State ensuring the welcome spin runs exactly once per view initialization
  const [welcomeSpinComplete, setWelcomeSpinComplete] = useState(false);
  
  const welcomeTargetRotation = Math.PI * 2; // Exactly 360 degrees
  const gracefulSpeed = 0.005; // 💡 MATCHED VELOCITY: Perfectly matches your smooth perpetual spin speed

  useFrame(() => {
    // 1️⃣ Sequence A: Handle the initial introductory welcome 360° orbit
    if (!welcomeSpinComplete) {
      currentAngleRef.current += gracefulSpeed;

      // Calculate camera distance dynamically from its default position
      const radius = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2) || 4;
      
      // Update camera position along the X-Z horizontal ground circle grid plane
      camera.position.x = Math.sin(currentAngleRef.current) * radius;
      camera.position.z = Math.cos(currentAngleRef.current) * radius;
      camera.lookAt(0, 0, 0); // Keep camera locked onto the exact center of the product

      // Once it completes a full mathematical loop circle, reset angle reference and lock it out
      if (currentAngleRef.current >= welcomeTargetRotation) {
        currentAngleRef.current = 0;
        setWelcomeSpinComplete(true);
      }
    } 
    // 2️⃣ Sequence B: If intro is done, yield control entirely to the UI toggle state
    else if (isAutoRotating) {
      currentAngleRef.current += gracefulSpeed;

      const radius = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2) || 4;
      camera.position.x = Math.sin(currentAngleRef.current) * radius;
      camera.position.z = Math.cos(currentAngleRef.current) * radius;
      camera.lookAt(0, 0, 0);
    }
    // If stationary and not interacting, sync the reference angle back to where the camera is sitting
    else {
      currentAngleRef.current = Math.atan2(camera.position.x, camera.position.z);
    }
  });

  return (
    <group>
      <primitive object={scene} dispose={null} />
    </group>
  );
}

/** LIVE CANVAS RENDERING COMPONENT (DESIGN MODE PREVIEW) */
export function ModelViewport({
  modelUrl,
  textureCanvas,
  packageColor = "#ffffff",
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
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.color.set(packageColor);
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