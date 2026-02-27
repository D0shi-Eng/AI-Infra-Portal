/**
 * three-init.js
 * خلفية ثلاثية الأبعاد احترافية: شبكة عصبية من الجسيمات المتصلة
 * مع تفاعل الماوس وتأثيرات لونية ديناميكية
 */

(function () {
  const canvas = document.getElementById("bg3d");
  if (!canvas) return;

  // Scene
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Mouse tracking
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  // ─── Particle System (Neural Network Nodes) ───
  const PARTICLE_COUNT = 200;
  const SPREAD = 50;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const velocities = [];

  const neonColor = new THREE.Color(0x00f5ff);
  const purpleColor = new THREE.Color(0x9d00ff);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    positions[i3]     = (Math.random() - 0.5) * SPREAD;
    positions[i3 + 1] = (Math.random() - 0.5) * SPREAD;
    positions[i3 + 2] = (Math.random() - 0.5) * SPREAD * 0.6;

    const t = Math.random();
    const c = neonColor.clone().lerp(purpleColor, t);
    colors[i3]     = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;

    sizes[i] = Math.random() * 3 + 1;

    velocities.push({
      x: (Math.random() - 0.5) * 0.015,
      y: (Math.random() - 0.5) * 0.015,
      z: (Math.random() - 0.5) * 0.008,
    });
  }

  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  particlesGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  // Custom shader for glowing particles
  const particleMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float dist = length(mv.xyz);
        vAlpha = clamp(1.0 - dist / 60.0, 0.2, 1.0);
        gl_PointSize = size * (300.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float glow = 1.0 - smoothstep(0.0, 0.5, d);
        glow = pow(glow, 1.5);
        gl_FragColor = vec4(vColor, glow * vAlpha * 0.85);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const particles = new THREE.Points(particlesGeometry, particleMaterial);
  scene.add(particles);

  // ─── Connection Lines ───
  const MAX_CONNECTIONS = 400;
  const CONNECTION_DIST = 8;
  const linePositions = new Float32Array(MAX_CONNECTIONS * 6);
  const lineColors = new Float32Array(MAX_CONNECTIONS * 6);

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
  lineGeometry.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));
  lineGeometry.setDrawRange(0, 0);

  const lineMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lines);

  // ─── Central Glowing Orb ───
  const orbGeometry = new THREE.IcosahedronGeometry(2.5, 4);
  const orbMaterial = new THREE.MeshBasicMaterial({
    color: 0x00f5ff,
    transparent: true,
    opacity: 0.08,
    wireframe: true,
  });
  const orb = new THREE.Mesh(orbGeometry, orbMaterial);
  scene.add(orb);

  // ─── Outer Ring ───
  const ringGeometry = new THREE.TorusGeometry(12, 0.08, 8, 100);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x9d00ff,
    transparent: true,
    opacity: 0.15,
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI * 0.5;
  scene.add(ring);

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(16, 0.05, 8, 120),
    new THREE.MeshBasicMaterial({ color: 0x00f5ff, transparent: true, opacity: 0.08 })
  );
  ring2.rotation.x = Math.PI * 0.35;
  ring2.rotation.z = Math.PI * 0.2;
  scene.add(ring2);

  // ─── Animation Loop ───
  let time = 0;

  function updateConnections() {
    let connIdx = 0;
    const pos = particlesGeometry.attributes.position.array;

    for (let i = 0; i < PARTICLE_COUNT && connIdx < MAX_CONNECTIONS; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT && connIdx < MAX_CONNECTIONS; j++) {
        const dx = pos[i * 3] - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < CONNECTION_DIST) {
          const alpha = 1 - dist / CONNECTION_DIST;
          const idx = connIdx * 6;

          linePositions[idx]     = pos[i * 3];
          linePositions[idx + 1] = pos[i * 3 + 1];
          linePositions[idx + 2] = pos[i * 3 + 2];
          linePositions[idx + 3] = pos[j * 3];
          linePositions[idx + 4] = pos[j * 3 + 1];
          linePositions[idx + 5] = pos[j * 3 + 2];

          lineColors[idx]     = alpha * 0;
          lineColors[idx + 1] = alpha * 0.96;
          lineColors[idx + 2] = alpha * 1;
          lineColors[idx + 3] = alpha * 0.62;
          lineColors[idx + 4] = alpha * 0;
          lineColors[idx + 5] = alpha * 1;

          connIdx++;
        }
      }
    }

    lineGeometry.setDrawRange(0, connIdx * 2);
    lineGeometry.attributes.position.needsUpdate = true;
    lineGeometry.attributes.color.needsUpdate = true;
  }

  function animate() {
    requestAnimationFrame(animate);
    time += 0.005;

    // Smooth mouse follow
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Update particle positions
    const pos = particlesGeometry.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      pos[i3]     += velocities[i].x;
      pos[i3 + 1] += velocities[i].y;
      pos[i3 + 2] += velocities[i].z;

      // Wrap around
      const half = SPREAD * 0.5;
      if (pos[i3] > half) pos[i3] = -half;
      if (pos[i3] < -half) pos[i3] = half;
      if (pos[i3 + 1] > half) pos[i3 + 1] = -half;
      if (pos[i3 + 1] < -half) pos[i3 + 1] = half;
    }
    particlesGeometry.attributes.position.needsUpdate = true;

    // Update connections every 3 frames for performance
    if (Math.floor(time * 200) % 3 === 0) {
      updateConnections();
    }

    // Rotate orb
    orb.rotation.x = time * 0.4;
    orb.rotation.y = time * 0.6;
    orb.scale.setScalar(1 + Math.sin(time * 2) * 0.05);

    // Rotate rings
    ring.rotation.z = time * 0.3;
    ring2.rotation.z = -time * 0.2;
    ring2.rotation.y = time * 0.15;

    // Camera responds to mouse
    camera.position.x += (mouse.x * 3 - camera.position.x) * 0.02;
    camera.position.y += (mouse.y * 2 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  animate();

  // ─── Events ───
  window.addEventListener("mousemove", (e) => {
    mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();