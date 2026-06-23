import { useEffect, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface ModelViewportProps {
  modelUrl: string;
  textureCanvas?: HTMLCanvasElement | null;
  packageColor?: string;
  isAutoRotating?: boolean;
  adminTextureUrl?: string; // Bound: Receives your secure Cloudinary delivery asset URL
}

/** 🌌 UPGRADED SCENE RUNTIME FOR OVERVIEW PANEL: Animates the camera orbit for realistic HDR world movement */
export function StaticScene({ modelUrl, isAutoRotating = false }: { modelUrl: string; isAutoRotating?: boolean }) {
  const { scene } = useGLTF(modelUrl);
  const { camera } = useThree();
  
  const currentAngleRef = useRef(0);
  const [welcomeSpinComplete, setWelcomeSpinComplete] = useState(false);
  
  const welcomeTargetRotation = Math.PI * 2;
  const gracefulSpeed = 0.005;

  useFrame(() => {
    if (!welcomeSpinComplete) {
      currentAngleRef.current += gracefulSpeed;
      const radius = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2) || 4;
      camera.position.x = Math.sin(currentAngleRef.current) * radius;
      camera.position.z = Math.cos(currentAngleRef.current) * radius;
      camera.lookAt(0, 0, 0);

      if (currentAngleRef.current >= welcomeTargetRotation) {
        currentAngleRef.current = 0;
        setWelcomeSpinComplete(true);
      }
    } else if (isAutoRotating) {
      currentAngleRef.current += gracefulSpeed;
      const radius = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2) || 4;
      camera.position.x = Math.sin(currentAngleRef.current) * radius;
      camera.position.z = Math.cos(currentAngleRef.current) * radius;
      camera.lookAt(0, 0, 0);
    } else {
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
  adminTextureUrl,
}: ModelViewportProps) {
  const { scene } = useGLTF(modelUrl);
  const textureRef = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    // 1. First Pass: Apply base glaze color to all body parts EXCEPT the customcanvas mesh
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;

      if (!mesh.name.toLowerCase().includes("customcanvas")) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.color.set(packageColor);
          mat.map = null;
          mat.needsUpdate = true;
        }
      }
    });

    // 2. Second Pass: Clear old texture data layers safely
    textureRef.current?.dispose();

    // 💡 SCENARIO A: Admin Dashboard View -> Load and display the transparent bake texture directly from Cloudinary link
    if (adminTextureUrl) {
      const loader = new THREE.TextureLoader();
      
      // Cloudinary completely honors this, allowing unhindered pixel compilation inside the Iframe!
      loader.setCrossOrigin("anonymous");
      
      loader.load(adminTextureUrl, (fetchedTex) => {
        fetchedTex.colorSpace = THREE.SRGBColorSpace;
        fetchedTex.anisotropy = 16;
        fetchedTex.flipY = false;
        textureRef.current = fetchedTex;

        scene.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh && mesh.name.toLowerCase().includes("customcanvas")) {
            mesh.material = new THREE.MeshStandardMaterial({
              map: fetchedTex,
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
          }
        });
      });
    }
    // 💡 SCENARIO B: FrontEnd Storefront Studio View -> Apply local interactive drawing canvas
    else if (textureCanvas) {
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
        if (mesh.isMesh && mesh.name.toLowerCase().includes("customcanvas")) {
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
        }
      });
    }
  }, [scene, textureCanvas, packageColor, adminTextureUrl]);

  useFrame(() => {
    if (textureRef.current) textureRef.current.needsUpdate = true;
  });

  return <primitive object={scene} dispose={null} scale={1.5} />;
}