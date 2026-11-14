'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

type ThreeSceneProps = {
  className?: string;
  onSelectBodyPart?: (systemId: string) => void;
  vitals?: { heartRate: number | null; spo2: number | null };
  modelVariant?: string;
};

const HOME_POSITION = new THREE.Vector3(0, 0.5, 2.65);

// Heart model cutaway
const HEART_MODEL_URL = `${import.meta.env.BASE_URL}models/heart/scene.gltf`;
const heartGroup = new THREE.Group();
const HOME_TARGET = new THREE.Vector3(0, 0.22, 0);
const FOCUS_DISTANCE = 0.95;

// Available body model variants
export const MODEL_VARIANTS: Record<string, { label: string; url: string; height: number }> = {
  astronaut: {
    label: 'Astronaut Suit',
    url: `${import.meta.env.BASE_URL}models/astronaut/scene.gltf`,
    height: 1.45,
  },
  rust_space_suit: {
    label: 'Rust Space Suit',
    url: `${import.meta.env.BASE_URL}models/rust_space_suit/scene.gltf`,
    height: 1.7,
  },
  employee: {
    label: 'Employee Model',
    url: `${import.meta.env.BASE_URL}models/employee/scene.gltf`,
    height: 1.9,
  },
};

// Normalised height (0 = feet, 1 = top of helmet) of the centre of each region.
const SYSTEM_FOCUS_HEIGHT: Record<string, number> = {
  neurological: 0.92,
  cardiovascular: 0.7,
  respiratory: 0.55,
  musculoskeletal: 0.24,
};

export function ThreeScene({ className = '', onSelectBodyPart, vitals, modelVariant = 'astronaut' }: ThreeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelectBodyPart);
  const resetViewRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [heartOpen, setHeartOpen] = useState(false);
  const currentVariantRef = useRef(modelVariant);

  useEffect(() => {
    onSelectRef.current = onSelectBodyPart;
  }, [onSelectBodyPart]);

  // Track current variant for model reload
  useEffect(() => {
    currentVariantRef.current = modelVariant;
  }, [modelVariant]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const w = el.clientWidth || 400;
    const h = el.clientHeight || 400;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03060c);

    const cam = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    cam.position.copy(HOME_POSITION);
    cam.lookAt(HOME_TARGET);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';
    el.appendChild(renderer.domElement);

    // Image-based lighting makes the suit's metal and visor materials readable.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envTarget = pmrem.fromScene(room, 0.04);
    scene.environment = envTarget.texture;

    scene.add(new THREE.AmbientLight(0x7f8cff, 0.65));

    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(2.5, 3.5, 3);
    key.castShadow = true;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x00f3ff, 1.1);
    fill.position.set(-2.5, 1.5, 1.5);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xa855f7, 1.6);
    rim.position.set(0, 1, -3);
    scene.add(rim);

    // ── Body model pivot ───────────────────────────────────
    const modelPivot = new THREE.Group();
    scene.add(modelPivot);

    const modelBounds = new THREE.Box3();
    let loadedModel: THREE.Object3D | null = null;
    let disposed = false;
    let currentModelUrl = MODEL_VARIANTS.astronaut.url;
    const suitMaterials: THREE.MeshStandardMaterial[] = [];

    const setSuitGhost = (ghost: boolean) => {
      suitMaterials.forEach(mat => {
        const original = mat.userData.original as
          | { opacity: number; transparent: boolean; depthWrite: boolean }
          | undefined;
        mat.transparent = ghost ? true : original?.transparent ?? false;
        mat.opacity = ghost ? 0.28 : original?.opacity ?? 1;
        mat.depthWrite = ghost ? false : original?.depthWrite ?? true;
        mat.needsUpdate = true;
      });
    };

    const loadModel = (variant: string) => {
      const info = MODEL_VARIANTS[variant] ?? MODEL_VARIANTS.astronaut;
      currentModelUrl = info.url;
      setStatus('loading');

      // Remove previous model
      if (loadedModel) {
        modelPivot.remove(loadedModel);
        disposeObject(loadedModel);
        loadedModel = null;
      }
      suitMaterials.length = 0;

      const loader = new GLTFLoader();
      loader.load(
        info.url,
        (gltf) => {
          if (disposed) {
            disposeObject(gltf.scene);
            return;
          }

          const model = gltf.scene;

          // Normalise the model to a predictable height and put its
          // feet on the floor ring so the camera framing stays consistent.
          const initialBox = new THREE.Box3().setFromObject(model);
          const initialSize = initialBox.getSize(new THREE.Vector3());
          const targetHeight = info.height;
          const scale = targetHeight / Math.max(initialSize.y, 0.001);
          model.scale.setScalar(scale);
          model.updateMatrixWorld(true);

          const scaledBox = new THREE.Box3().setFromObject(model);
          const center = scaledBox.getCenter(new THREE.Vector3());
          model.position.set(-center.x, -scaledBox.min.y - 0.44, -center.z);
          model.updateMatrixWorld(true);
          modelBounds.setFromObject(model);

          model.traverse(obj => {
            if ((obj as THREE.Mesh).isMesh) {
              const mesh = obj as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              materials.forEach(mat => {
                const m = mat as THREE.MeshStandardMaterial;
                if ('envMapIntensity' in m) {
                  m.envMapIntensity = 1.15;
                }
                m.userData.original = {
                  opacity: m.opacity,
                  transparent: m.transparent,
                  depthWrite: m.depthWrite,
                };
                suitMaterials.push(m);
              });
            }
          });

          // Place the heart hotspot on the chest (visible front of the body).
          const hCenter = modelBounds.getCenter(new THREE.Vector3());
          const hHeight = Math.max(modelBounds.max.y - modelBounds.min.y, 0.001);
          hotspot.position.set(
            hCenter.x - 0.04,
            modelBounds.min.y + hHeight * 0.72,
            hCenter.z + 0.17,
          );
          hotspot.visible = true;

          modelPivot.add(model);
          loadedModel = model;
          setStatus('ready');
        },
        undefined,
        (error) => {
          console.error(`Failed to load model variant "${variant}":`, error);
          if (!disposed) setStatus('error');
        },
      );
    };

    // Initial model load
    loadModel(modelVariant);

    // Reload model when variant changes
    const variantCheckInterval = setInterval(() => {
      const currentVariant = currentVariantRef.current;
      const info = MODEL_VARIANTS[currentVariant] ?? MODEL_VARIANTS.astronaut;
      if (info.url !== currentModelUrl && !disposed) {
        loadModel(currentVariant);
      }
    }, 200);

    // Load heart model for cardiovascular cutaway using separate loader instance

    // Load heart model for cardiovascular cutaway using separate loader instance
    const heartLoader = new GLTFLoader();
    heartLoader.load(
      HEART_MODEL_URL,
      (gltf) => {
        console.log('Heart model loaded successfully!');
        if (disposed) {
          disposeObject(gltf.scene);
          return;
        }
        const heart = gltf.scene;
        // Normalise the heart so it fits in the chest cutaway window
        const heartBox = new THREE.Box3().setFromObject(heart);
        const heartSize = heartBox.getSize(new THREE.Vector3());
        const heartScale = 0.22 / Math.max(heartSize.y, 0.001);
        heart.scale.setScalar(heartScale);
        heart.updateMatrixWorld(true);

        // Centre the heart on the group origin
        const scaledHeartBox = new THREE.Box3().setFromObject(heart);
        const center = scaledHeartBox.getCenter(new THREE.Vector3());
        heart.position.set(-center.x, -center.y, -center.z);
        heart.updateMatrixWorld(true);

        // Keep the original textured materials; just make sure they render.
        heart.traverse(obj => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach(mat => {
              const m = mat as THREE.MeshStandardMaterial;
              m.opacity = 1;
              m.transparent = false;
              m.visible = true;
              if ('emissive' in m) {
                m.emissive = new THREE.Color(0x5c0010);
                m.emissiveIntensity = 0.8;
              }
              m.needsUpdate = true;
            });
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });

        heartGroup.add(heart);
        // Visibility is controlled on heartGroup itself, so the model root must
        // stay visible or none of its meshes will render.
        heart.visible = true;
      },
      undefined,
      (error) => {
        console.error('Failed to load heart model:', error);
        console.error('Heart model URL was:', HEART_MODEL_URL);
        console.error('import.meta.env.BASE_URL:', import.meta.env.BASE_URL);
        // Try alternative URL
        console.log('Attempting to fetch URL directly...');
        fetch(HEART_MODEL_URL)
          .then(res => {
            console.log('Fetch response status:', res.status, res.statusText);
            console.log('Content-Type:', res.headers.get('content-type'));
            return res.text();
          })
          .then(text => {
            console.log('Response preview (first 200 chars):', text.substring(0, 200));
          })
          .catch(err => {
            console.error('Fetch failed:', err);
          });
      },
    );

    // Floating particles - deterministic orbital positions
    // Particles orbit in specific bands around the astronaut
    const pCount = 200;
    const pg = new THREE.BufferGeometry();
    const pp = new Float32Array(pCount * 3);
    const particleRadii = new Float32Array(pCount);
    for (let i = 0; i < pCount; i++) {
      // Distribute particles in orbital rings at different heights
      const ringIndex = i % 4;
      const baseR = 1.8 + ringIndex * 0.6;
      const angleOffset = (i / pCount) * Math.PI * 2 + ringIndex * 1.5;
      const heightOffset = (ringIndex - 1.5) * 0.4;
      
      particleRadii[i] = baseR;
      pp[i * 3] = baseR * Math.cos(angleOffset);
      pp[i * 3 + 1] = heightOffset + Math.sin(angleOffset * 0.5) * 0.2;
      pp[i * 3 + 2] = baseR * Math.sin(angleOffset);
    }
    pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    const pm = new THREE.PointsMaterial({
      color: 0x00f3ff, size: 0.015, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, sizeAttenuation: true,
    });
    const particles = new THREE.Points(pg, pm);
    particles.name = 'particles';
    scene.add(particles);

    // Starfield - deterministic positions based on golden angle distribution
    // This creates a realistic, uniform star distribution without randomness
    const starCount = 600;
    const sg = new THREE.BufferGeometry();
    const sp = new Float32Array(starCount * 3);
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const goldenAngle = 2 * Math.PI * (1 - 1 / goldenRatio);
    // Realistic star magnitude distribution (more dim stars than bright ones)
    const magnitudes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      // Fibonacci sphere distribution for uniform coverage
      const y = 1 - (i / (starCount - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      
      // Scale to scene dimensions with realistic depth
      const depthScale = 8 + (i % 5) * 2; // Vary depth in layers
      sp[i * 3] = Math.cos(theta) * radius * 15;
      sp[i * 3 + 1] = y * 10;
      sp[i * 3 + 2] = -(5 + (i * 7) % 20 + depthScale * 0.5);
      
      // Store magnitude for varying brightness (simulated)
      magnitudes[i] = 0.3 + (i % 10) * 0.07;
    }
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const sm = new THREE.PointsMaterial({
      color: 0x94a3b8, size: 0.03, transparent: true, opacity: 0.8, sizeAttenuation: true,
    });
    const stars = new THREE.Points(sg, sm);
    scene.add(stars);

    // Heart model group (cutaway for cardiovascular system)
    scene.add(heartGroup);
    heartGroup.visible = false;


    // Glow ring at base
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff, transparent: true, opacity: 0.15,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.6, 64), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.44;
    scene.add(ring);

    const ringOuter = ring.clone();
    ringOuter.material = ringMat.clone();
    ringOuter.material.opacity = 0.08;
    ringOuter.scale.set(1.5, 1.5, 1.5);
    ringOuter.position.y = -0.46;
    scene.add(ringOuter);

    // Highlight marker shown on the selected body region.
    const markerMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const marker = new THREE.Mesh(new THREE.RingGeometry(0.11, 0.125, 48), markerMat);
    marker.visible = false;
    scene.add(marker);

    const markerCoreMat = new THREE.MeshBasicMaterial({
      color: 0x9dfff9, transparent: true, opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const markerCore = new THREE.Mesh(new THREE.CircleGeometry(0.028, 24), markerCoreMat);
    markerCore.visible = false;
    scene.add(markerCore);

    // Small always-on hotspot marking the exact heart click target.
    const hotspotMat = new THREE.MeshBasicMaterial({
      color: 0xef4444, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const hotspot = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.028, 32), hotspotMat);
    hotspot.visible = false;
    scene.add(hotspot);


    // ── Orbit / zoom controls ──────────────────────────────
    const controls = new OrbitControls(cam, renderer.domElement);
    controls.target.copy(HOME_TARGET);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.rotateSpeed = 0.9;
    controls.zoomSpeed = 0.9;
    controls.minDistance = 0.45;
    controls.maxDistance = 6;
    controls.minPolarAngle = 0.15;
    controls.maxPolarAngle = Math.PI - 0.15;
    controls.update();

    let viewTween: gsap.core.Tween | null = null;
    let markerPulse = 0;

    const animateCamera = (endPosition: THREE.Vector3, endTarget: THREE.Vector3, onDone?: () => void) => {
      viewTween?.kill();
      controls.enabled = false;
      const startPosition = cam.position.clone();
      const startTarget = controls.target.clone();
      const proxy = { t: 0 };
      viewTween = gsap.to(proxy, {
        t: 1,
        duration: 0.9,
        ease: 'power3.inOut',
        onUpdate: () => {
          cam.position.lerpVectors(startPosition, endPosition, proxy.t);
          controls.target.lerpVectors(startTarget, endTarget, proxy.t);
          controls.update();
        },
        onComplete: () => {
          controls.enabled = true;
          viewTween = null;
          onDone?.();
        },
      });
    };

    const resetView = () => {
      marker.visible = false;
      markerCore.visible = false;
      heartGroup.visible = false;
      setSuitGhost(false);
      setHeartOpen(false);
      animateCamera(HOME_POSITION.clone(), HOME_TARGET.clone());
    };

    resetViewRef.current = resetView;

    const focusOnSystem = (system: string, point?: THREE.Vector3, showHeart = false) => {
      const height = Math.max(modelBounds.max.y - modelBounds.min.y, 0.001);
      const normalized = SYSTEM_FOCUS_HEIGHT[system] ?? 0.6;
      const center = modelBounds.getCenter(new THREE.Vector3());
      const focusPoint = point
        ? point.clone()
        : new THREE.Vector3(center.x, modelBounds.min.y + height * normalized, center.z);

      // Keep the user's current viewing direction so the zoom feels natural.
      const direction = cam.position.clone().sub(controls.target).normalize();
      if (direction.lengthSq() < 0.001) direction.set(0, 0.15, 1).normalize();

      marker.position.copy(focusPoint);
      marker.quaternion.copy(cam.quaternion);
      marker.visible = true;
      marker.scale.setScalar(1);
      markerCore.position.copy(focusPoint);
      markerCore.quaternion.copy(cam.quaternion);
      markerCore.visible = true;
      markerPulse = 0;

      // Ghost the suit once, based on the selected system. This must happen
      // before/independently of the per-organ branches so their else-cleanup
      // cannot cancel it.
      const ghostSuit = system === 'cardiovascular';
      setSuitGhost(ghostSuit);
      setHeartOpen(system === 'cardiovascular' && showHeart);

      // Show heart model when cardiovascular system is focused
      if (system === 'cardiovascular') {
        heartGroup.visible = true;
        // Make all heart meshes visible
        heartGroup.traverse(obj => {
          if ((obj as THREE.Mesh).isMesh) {
            (obj as THREE.Mesh).visible = true;
            (obj as THREE.Mesh).castShadow = true;
            (obj as THREE.Mesh).receiveShadow = true;
            const mat = (obj as THREE.Mesh).material;
            const mats = (Array.isArray(mat) ? mat : [mat]) as THREE.Material[];
            mats.forEach(m => {
              m.opacity = 1;
              m.transparent = false;
              m.needsUpdate = true;
            });
          }
        });

        if (showHeart) {
          // Only the dedicated heart hotspot reveals the organ. Anchor it at the
          // anatomical heart spot and pull it just under the chest surface.
          setHeartOpen(true);
          heartGroup.visible = true;
          heartGroup.traverse(obj => {
            if ((obj as THREE.Mesh).isMesh) {
              (obj as THREE.Mesh).visible = true;
            }
          });
          const bodyCenter = modelBounds.getCenter(new THREE.Vector3());
          const heartAnchor = new THREE.Vector3(
            bodyCenter.x - 0.04,
            modelBounds.min.y + height * 0.72,
            bodyCenter.z,
          );
          heartGroup.position
            .copy(heartAnchor)
            .add(direction.clone().multiplyScalar(0.06));
          heartGroup.quaternion.copy(cam.quaternion);
        } else {
          heartGroup.visible = false;
          setHeartOpen(false);
        }
      }
      const endTarget = focusPoint.clone();
      const endPosition = focusPoint.clone().add(direction.multiplyScalar(FOCUS_DISTANCE));
      animateCamera(endPosition, endTarget);
    };

    // Animation loop
    let raf = 0;
    function animate() {
      raf = requestAnimationFrame(animate);
      const t = Date.now() * 0.001;
      modelPivot.position.y = Math.sin(t * 0.8) * 0.012;

      particles.rotation.y += 0.0005;
      stars.rotation.y += 0.0002;
      ring.rotation.z += 0.005;
      ringOuter.rotation.z -= 0.003;

      if (marker.visible) {
        markerPulse = (markerPulse + 0.032) % (Math.PI * 2);
        const pulse = 1 + Math.sin(markerPulse) * 0.16;
        marker.scale.setScalar(pulse);
        markerMat.opacity = 0.55 + Math.sin(markerPulse) * 0.3;
        marker.quaternion.copy(cam.quaternion);
        markerCore.quaternion.copy(cam.quaternion);
      }

      controls.update();
      renderer.render(scene, cam);
    }
    raf = requestAnimationFrame(animate);

    // Resize
    const ro = new ResizeObserver(() => {
      if (!el) return;
      const nw = el.clientWidth || 400;
      const nh = el.clientHeight || 400;
      cam.aspect = nw / nh;
      cam.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    ro.observe(el);

    // Click a body region to select + zoom to the matching body system.
    // Pointer distance is used so orbiting a drag never counts as a click.
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const canvas = renderer.domElement;
    canvas.style.cursor = 'grab';

    let downX = 0;
    let downY = 0;
    let downAt = 0;
    let downId: number | null = null;

    const handlePointerDown = (event: PointerEvent) => {
      downX = event.clientX;
      downY = event.clientY;
      downAt = performance.now();
      downId = event.pointerId;
      canvas.style.cursor = 'grabbing';
    };

    const handlePointerUp = (event: PointerEvent) => {
      canvas.style.cursor = 'grab';
      if (downId !== event.pointerId) return;
      downId = null;
      if (!onSelectRef.current || !loadedModel) return;
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > 6) return;
      if (performance.now() - downAt > 700) return;

      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, cam);
      const hits = raycaster.intersectObject(modelPivot, true);
      if (!hits.length) return;

      const hit = hits[0];
      const height = Math.max(modelBounds.max.y - modelBounds.min.y, 0.001);
      const normalizedY = THREE.MathUtils.clamp((hit.point.y - modelBounds.min.y) / height, 0, 1);
      let system: string;
      if (normalizedY > 0.84) system = 'neurological';
      else if (normalizedY > 0.58) system = 'cardiovascular';
      else if (normalizedY > 0.38) system = 'respiratory';
      else system = 'musculoskeletal';

      // The heart organ only appears when the user hits a small hotspot around
      // the heart position, not for the whole chest region.
      const bodyCenter = modelBounds.getCenter(new THREE.Vector3());
      const heartAnchor = new THREE.Vector3(
        bodyCenter.x - 0.04,
        modelBounds.min.y + height * 0.72,
        bodyCenter.z,
      );
      // Compare x/y only so the dot works from any orbit angle, ignoring depth.
      const isHeartHit =
        Math.abs(hit.point.x - heartAnchor.x) < 0.1 &&
        Math.abs(hit.point.y - heartAnchor.y) < 0.1;

      focusOnSystem(system, hit.point, isHeartHit);
      onSelectRef.current(system);
    };

    const handleDoubleClick = (event: MouseEvent) => {
      // Double-click anywhere in the canvas returns to the full-body view.
      event.preventDefault();
      resetView();
    };

    const handlePointerLeave = () => {
      if (downId === null) canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('dblclick', handleDoubleClick);

    return () => {
      disposed = true;
      clearInterval(variantCheckInterval);
      ro.disconnect();
      cancelAnimationFrame(raf);
      viewTween?.kill();
      resetViewRef.current = null;
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('dblclick', handleDoubleClick);
      controls.dispose();
      if (loadedModel) disposeObject(loadedModel);
      pg.dispose();
      pm.dispose();
      sg.dispose();
      sm.dispose();
      ring.geometry.dispose();
      ringMat.dispose();
      ringOuter.geometry.dispose();
      (ringOuter.material as THREE.Material).dispose();
      marker.geometry.dispose();
      markerMat.dispose();
      markerCore.geometry.dispose();
      markerCoreMat.dispose();
      hotspot.geometry.dispose();
      hotspotMat.dispose();
      room.dispose?.();
      envTarget.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const heartRate = vitals?.heartRate ?? null;
  const spo2 = vitals?.spo2 ?? null;
  // Default values for display when no data is available (will show as '--' visually)
  const hrDisplay = heartRate ?? 0;
  const spo2Display = spo2 ?? 0;
  const pulseDisplay = Math.round(hrDisplay);
  const hasVitals = heartRate != null && spo2 != null;

  return (
    <div
      ref={mountRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '300px',
        background: 'radial-gradient(ellipse at center, rgba(0,243,255,0.04) 0%, transparent 70%)',
      }}
    >
      {status === 'ready' && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <button
            type="button"
            onClick={() => resetViewRef.current?.()}
            className="pointer-events-auto absolute top-2 right-2 px-2.5 py-1 rounded border font-mono text-[9px] tracking-widest transition-colors hover:bg-cyan-500/15"
            style={{
              borderColor: 'rgba(0,243,255,0.3)',
              color: 'rgba(0,243,255,0.85)',
              background: 'rgba(3,10,18,0.7)',
            }}
          >
            ⟲ RESET VIEW
          </button>

                        {heartOpen && (
            <div
              className="absolute top-2 left-2 rounded-lg border px-3 py-2.5 font-mono"
              style={{
                borderColor: 'rgba(239,68,68,0.45)',
                background: 'rgba(12,4,7,0.82)',
                boxShadow: '0 0 18px rgba(239,68,68,0.2)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-[9px] tracking-widest" style={{ color: '#f87171' }}>
                  CARDIOVASCULAR // {hasVitals ? 'TELEMETRY ACTIVE' : 'NO TELEMETRY'}
                </span>
              </div>
              <div className="mt-2 flex items-end gap-4">
                <div>
                  <div className="text-[9px] tracking-widest" style={{ color: '#94a3b8' }}>HEART RATE</div>
                  <div className="text-lg font-bold leading-none" style={{ color: hasVitals ? '#f87171' : '#64748b' }}>
                    {hasVitals ? Math.round(hrDisplay) : '--'}<span className="text-[9px] ml-1">BPM</span>
                  </div>
                </div>
                <div>
                  <div className="text-[9px] tracking-widest" style={{ color: '#94a3b8' }}>PULSE</div>
                  <div className="text-lg font-bold leading-none" style={{ color: hasVitals ? '#fca5a5' : '#64748b' }}>
                    {hasVitals ? pulseDisplay : '--'}<span className="text-[9px] ml-1">BPM</span>
                  </div>
                </div>
                <div>
                  <div className="text-[9px] tracking-widest" style={{ color: '#94a3b8' }}>SpO₂</div>
                  <div className="text-lg font-bold leading-none" style={{ color: hasVitals ? '#22d3ee' : '#64748b' }}>
                    {hasVitals ? Math.round(spo2Display) : '--'}<span className="text-[9px] ml-1">%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            className="absolute bottom-2 left-2 right-2 flex items-center justify-center font-mono text-[9px] tracking-wider"
            style={{ color: 'rgba(148,163,184,0.75)' }}
          >
            DRAG TO ROTATE · SCROLL TO ZOOM · CLICK A BODY REGION · DOUBLE-CLICK TO RESET
          </div>
        </div>
      )}

      {status !== 'ready' && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 pointer-events-none"
          style={{ background: 'rgba(3,6,12,0.55)' }}
        >
          {status === 'loading' ? (
            <>
              <div className="w-7 h-7 rounded-full border-2 border-cyan-500/30 border-t-cyan-300 animate-spin" />
              <span className="text-[10px] font-mono tracking-widest" style={{ color: 'rgba(0,243,255,0.7)' }}>
                LOADING {MODEL_VARIANTS[modelVariant]?.label ?? 'MODEL'}…
              </span>
            </>
          ) : (
            <span className="text-[10px] font-mono tracking-widest" style={{ color: '#ef4444' }}>
              3D MODEL UNAVAILABLE
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function disposeObject(root: THREE.Object3D) {
  root.traverse(obj => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach(mat => {
      for (const value of Object.values(mat)) {
        if (value instanceof THREE.Texture) value.dispose();
      }
      mat.dispose();
    });
  });
}