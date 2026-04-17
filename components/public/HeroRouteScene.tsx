'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type MovingCar = {
  group: THREE.Group;
  curve: THREE.CatmullRomCurve3;
  offset: number;
  speed: number;
};

function makeRoad(curve: THREE.CatmullRomCurve3, radius: number, color: number) {
  const geometry = new THREE.TubeGeometry(curve, 72, radius, 8, false);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
    metalness: 0.08,
  });
  return new THREE.Mesh(geometry, material);
}

function makeCar(color: number) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.16, 0.18),
    new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.12 })
  );
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.12, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xf4f7ef, roughness: 0.25, metalness: 0.18 })
  );
  const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xf5c15f });
  const leftLight = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.03, 0.025), lightMaterial);
  const rightLight = leftLight.clone();

  body.position.y = 0.04;
  cabin.position.set(-0.02, 0.13, 0);
  leftLight.position.set(0.18, 0.065, -0.055);
  rightLight.position.set(0.18, 0.065, 0.055);

  group.add(body, cabin, leftLight, rightLight);
  return group;
}

export default function HeroRouteScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 5.7, 7.2);
    camera.lookAt(0, 0, 0);

    const world = new THREE.Group();
    world.rotation.x = -0.1;
    scene.add(world);

    const ambient = new THREE.HemisphereLight(0xf7fff6, 0x123a35, 2.2);
    const key = new THREE.DirectionalLight(0xf7d487, 3.2);
    key.position.set(-2.5, 5.5, 3.5);
    scene.add(ambient, key);

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(8.5, 0.08, 5.7),
      new THREE.MeshStandardMaterial({ color: 0x153532, roughness: 0.9 })
    );
    base.position.y = -0.08;
    world.add(base);

    const gridMaterial = new THREE.MeshBasicMaterial({ color: 0x9fbfb6, transparent: true, opacity: 0.12 });
    for (let i = -5; i <= 5; i += 1) {
      const lineX = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.01, 5.6), gridMaterial);
      lineX.position.set(i * 0.75, -0.02, 0);
      const lineZ = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.01, 0.012), gridMaterial);
      lineZ.position.set(0, -0.018, i * 0.48);
      world.add(lineX, lineZ);
    }

    const routeA = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3.8, 0.04, 1.9),
      new THREE.Vector3(-2.1, 0.04, 0.9),
      new THREE.Vector3(-0.25, 0.04, 0.98),
      new THREE.Vector3(1.3, 0.04, 0.05),
      new THREE.Vector3(3.6, 0.04, -0.9),
    ]);
    const routeB = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3.7, 0.05, -1.55),
      new THREE.Vector3(-1.8, 0.05, -0.95),
      new THREE.Vector3(0.05, 0.05, -1.2),
      new THREE.Vector3(1.65, 0.05, -0.48),
      new THREE.Vector3(3.45, 0.05, 1.42),
    ]);
    const routeC = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.9, 0.06, -2.0),
      new THREE.Vector3(-1.7, 0.06, -0.2),
      new THREE.Vector3(-0.05, 0.06, 0.2),
      new THREE.Vector3(1.45, 0.06, 1.15),
      new THREE.Vector3(2.9, 0.06, 2.02),
    ]);

    world.add(makeRoad(routeA, 0.055, 0xe1ae45));
    world.add(makeRoad(routeB, 0.042, 0x58b98b));
    world.add(makeRoad(routeC, 0.034, 0xd9efe5));

    const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x214844, roughness: 0.82, metalness: 0.03 });
    const accentMaterial = new THREE.MeshStandardMaterial({ color: 0xefd084, roughness: 0.68, metalness: 0.04 });
    const buildingPositions = [
      [-3.25, -1.9, 0.82], [-2.55, -1.38, 0.46], [-1.5, -2.12, 0.62], [-0.7, -1.75, 0.36],
      [0.82, -2.04, 0.52], [1.58, -1.55, 0.76], [2.55, -1.95, 0.45], [3.2, -1.25, 0.58],
      [-3.5, 0.32, 0.42], [-2.7, 1.45, 0.72], [-1.38, 1.78, 0.38], [-0.42, 1.42, 0.56],
      [0.74, 1.8, 0.86], [1.82, 1.42, 0.44], [2.78, 0.55, 0.72], [3.42, 0.18, 0.38],
    ] as const;

    buildingPositions.forEach(([x, z, height], index) => {
      const geometry = new THREE.BoxGeometry(0.42, height, 0.42);
      const building = new THREE.Mesh(geometry, index % 5 === 0 ? accentMaterial : buildingMaterial);
      building.position.set(x, height / 2, z);
      world.add(building);
    });

    const hubMaterial = new THREE.MeshStandardMaterial({ color: 0xf1c75f, roughness: 0.35, metalness: 0.22 });
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.18, 32), hubMaterial);
    hub.position.set(-0.15, 0.11, 0.34);
    world.add(hub);

    const cars: MovingCar[] = [
      { group: makeCar(0xf1c75f), curve: routeA, offset: 0.05, speed: 0.022 },
      { group: makeCar(0x8fe5b4), curve: routeB, offset: 0.46, speed: 0.017 },
      { group: makeCar(0xf4f7ef), curve: routeC, offset: 0.72, speed: 0.014 },
    ];
    cars.forEach((car) => world.add(car.group));

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2;
    };
    container.addEventListener('pointermove', onPointerMove, { passive: true });

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(320, rect.width);
      const height = Math.max(360, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let isVisible = true;
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry?.isIntersecting ?? true;
    }, { threshold: 0.05 });
    visibilityObserver.observe(container);

    let frameId = 0;
    const start = performance.now();

    const paint = (now: number) => {
      const elapsed = (now - start) / 1000;
      const stillTime = prefersReducedMotion ? 2.4 : elapsed;

      world.rotation.z = THREE.MathUtils.lerp(world.rotation.z, pointer.x * 0.035, 0.035);
      world.rotation.x = THREE.MathUtils.lerp(world.rotation.x, -0.1 + pointer.y * 0.025, 0.035);
      hub.rotation.y = stillTime * 0.8;

      cars.forEach((car) => {
        const progress = (car.offset + stillTime * car.speed) % 1;
        const point = car.curve.getPointAt(progress);
        const tangent = car.curve.getTangentAt(progress);
        car.group.position.copy(point);
        car.group.position.y += 0.12;
        car.group.rotation.y = Math.atan2(tangent.x, tangent.z) + Math.PI / 2;
      });

      renderer.render(scene, camera);

      if (!prefersReducedMotion && isVisible) {
        frameId = requestAnimationFrame(paint);
      } else if (!prefersReducedMotion) {
        frameId = window.setTimeout(() => requestAnimationFrame(paint), 250) as unknown as number;
      }
    };

    frameId = requestAnimationFrame(paint);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      container.removeEventListener('pointermove', onPointerMove);
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
    };
  }, []);

  return (
    <div ref={containerRef} className="hero-route-scene" aria-hidden="true">
      <div className="hero-route-scene__fallback" />
      <canvas ref={canvasRef} className="hero-route-scene__canvas" data-hero-route-canvas />
    </div>
  );
}
