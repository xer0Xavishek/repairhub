import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ─── 1. 3D Rotating Geodesic Schematic (For Center "Workshop Nexus" Card) ───
export function NexusSchematicCanvas({ width = 240, height = 240 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 240;
    const height = containerRef.current.clientHeight || 240;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Group for object
    const group = new THREE.Group();
    scene.add(group);

    // Main Geodesic Polyhedron / Pyramid Structure
    const geom = new THREE.IcosahedronGeometry(1.4, 1);
    
    // Wireframe Mesh
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0xEAE0D6,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireframeMesh = new THREE.Mesh(geom, wireframeMat);
    group.add(wireframeMesh);

    // Inner Core Geometry in Terracotta (#CB4D22)
    const coreGeom = new THREE.OctahedronGeometry(0.8, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xCB4D22,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    group.add(coreMesh);

    // Particle Vertices / Points Cloud
    const pointsMat = new THREE.PointsMaterial({
      color: 0xCB4D22,
      size: 0.06,
      transparent: true,
      opacity: 0.9,
    });
    const points = new THREE.Points(geom, pointsMat);
    group.add(points);

    // Outer Orbiting Rings
    const ringGeom = new THREE.RingGeometry(1.8, 1.82, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xEAE0D6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 3;
    group.add(ring);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Continuous subtle rotation + mouse tilt
      group.rotation.y = elapsedTime * 0.4 + mouseX * 0.5;
      group.rotation.x = Math.sin(elapsedTime * 0.3) * 0.2 - mouseY * 0.5;
      
      coreMesh.rotation.y = -elapsedTime * 0.6;
      coreMesh.rotation.z = elapsedTime * 0.3;
      ring.rotation.z = elapsedTime * 0.15;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geom.dispose();
      coreGeom.dispose();
      ringGeom.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '240px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative'
      }} 
    />
  );
}

// ─── 2. Atmospheric Terrain / Wave Gradient Canvas (For Left "Diagnostic Scanning" Card) ───
export function TerrainScanningCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const render = () => {
      time += 0.02;
      const width = (canvas.width = canvas.offsetWidth);
      const height = (canvas.height = canvas.offsetHeight);

      // Deep atmospheric background
      const baseGrad = ctx.createLinearGradient(0, 0, 0, height);
      baseGrad.addColorStop(0, '#5C6B8B');
      baseGrad.addColorStop(0.4, '#7F6785');
      baseGrad.addColorStop(0.7, '#CB4D22');
      baseGrad.addColorStop(1, '#2D1B11');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // Animated Sine Waves representing Diagnostic Sensor Curves
      for (let w = 0; w < 4; w++) {
        ctx.beginPath();
        const offset = w * 0.8;
        const waveColor = w === 0 
          ? 'rgba(235, 94, 40, 0.85)' 
          : w === 1 
          ? 'rgba(203, 77, 34, 0.7)' 
          : w === 2 
          ? 'rgba(163, 62, 78, 0.6)' 
          : 'rgba(80, 40, 60, 0.8)';
        
        ctx.fillStyle = waveColor;
        ctx.moveTo(0, height);

        for (let x = 0; x <= width; x += 5) {
          const y = (height * 0.5) + (w * 35) + Math.sin(x * 0.015 + time + offset) * 28 + Math.cos(x * 0.008 - time) * 15;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        borderRadius: '2px',
        objectFit: 'cover'
      }} 
    />
  );
}

// ─── 3. Modular Pods Isometric Canvas (For Right "Modular Pods" Card) ───
export function ModularPodsCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const render = () => {
      time += 0.015;
      const width = (canvas.width = canvas.offsetWidth);
      const height = (canvas.height = canvas.offsetHeight);

      // Warm Sand / Architectural Gray Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#D6C7B8');
      grad.addColorStop(0.5, '#B8A898');
      grad.addColorStop(1, '#2D1B11');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Isometric Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;

      const centerX = width / 2;
      const centerY = height * 0.45;

      // Isometric Rotating Module Box
      const angle = time * 0.4;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const size = 42;

      const project = (x, y, z) => {
        // Rotate around Y
        const rx = x * cosA - z * sinA;
        const rz = x * sinA + z * cosA;
        // Isometric 30-degree projection
        const px = centerX + (rx - rz) * 0.866;
        const py = centerY + y + (rx + rz) * 0.5;
        return { x: px, y: py };
      };

      // Module Wireframe vertices
      const vertices = [
        project(-size, -size * 0.6, -size),
        project(size, -size * 0.6, -size),
        project(size, -size * 0.6, size),
        project(-size, -size * 0.6, size),
        project(-size, size * 0.6, -size),
        project(size, size * 0.6, -size),
        project(size, size * 0.6, size),
        project(-size, size * 0.6, size),
      ];

      // Draw wireframe edges
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ];

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      edges.forEach(([i, j]) => {
        ctx.moveTo(vertices[i].x, vertices[i].y);
        ctx.lineTo(vertices[j].x, vertices[j].y);
      });
      ctx.stroke();

      // Inner Core in Terracotta
      const coreSize = 18;
      const coreVerts = [
        project(-coreSize, -coreSize * 0.6, -coreSize),
        project(coreSize, -coreSize * 0.6, -coreSize),
        project(coreSize, -coreSize * 0.6, coreSize),
        project(-coreSize, -coreSize * 0.6, coreSize),
        project(-coreSize, coreSize * 0.6, -coreSize),
        project(coreSize, coreSize * 0.6, -coreSize),
        project(coreSize, coreSize * 0.6, coreSize),
        project(-coreSize, coreSize * 0.6, coreSize),
      ];

      ctx.beginPath();
      ctx.strokeStyle = '#CB4D22';
      ctx.lineWidth = 1.8;
      edges.forEach(([i, j]) => {
        ctx.moveTo(coreVerts[i].x, coreVerts[i].y);
        ctx.lineTo(coreVerts[j].x, coreVerts[j].y);
      });
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        borderRadius: '2px',
        objectFit: 'cover'
      }} 
    />
  );
}
