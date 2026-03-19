(function () {
  const checkpoints = [
    {
      label: "100% retention",
      title: "Full context",
      summary: "Both plates still select the original causal pivot. The round marker and diamond still overlap.",
      supportNote: "Three strong predecessor-support flows still feed the original pivot on both sides. No substitute-only flows have appeared yet.",
      recency: { status: "Original pivot", shell: 0.74, core: 0.95, links: 1.0, drift: 0.02, rupture: 0.02 },
      guarded: { status: "Original pivot", shell: 0.7, core: 0.98, links: 1.0, drift: 0.0, rupture: 0.0 },
    },
    {
      label: "80% retention",
      title: "Early compression",
      summary: "Recency broadens into a smoother shell, but the selected pivot still lands on the original causal pivot. L2 Guarded stays centered too.",
      supportNote: "The retained predecessor support under recency is thinning, but it still feeds the original pivot rather than a substitute one.",
      recency: { status: "Support thinning", shell: 0.82, core: 0.8, links: 0.82, drift: 0.08, rupture: 0.12 },
      guarded: { status: "Original pivot", shell: 0.72, core: 0.96, links: 1.0, drift: 0.01, rupture: 0.02 },
    },
    {
      label: "65% retention",
      title: "Mirage shelf",
      summary: "This is the first clean split: the red hill still looks coherent, but the selected pivot is already separating from the original pivot.",
      supportNote: "Solid support flows still feed the original pivot. Faint dashed red flows show local clues beginning to feed a plausible substitute pivot.",
      recency: { status: "Pivot drifting", shell: 0.9, core: 0.58, links: 0.52, drift: 0.18, rupture: 0.34 },
      guarded: { status: "Protected", shell: 0.7, core: 0.94, links: 1.0, drift: 0.01, rupture: 0.03 },
    },
    {
      label: "50% retention",
      title: "Pivot substitution",
      summary: "The red hill still sounds coherent, but the selected pivot has visibly moved toward a substitute causal pivot. Blue remains aligned.",
      supportNote: "Only a weak predecessor-support flow still ties recency back to the original pivot, while dashed red flows start carrying substitute support from a substitute basin.",
      recency: { status: "Substitute pull", shell: 0.96, core: 0.28, links: 0.22, drift: 0.34, rupture: 0.62 },
      guarded: { status: "Protected", shell: 0.66, core: 0.9, links: 0.96, drift: 0.02, rupture: 0.05 },
    },
    {
      label: "40% retention",
      title: "Validity mirage",
      summary: "This is the mirage: the red hill stays high after the original pivot is gone, and the selected pivot has broken toward a wrong causal pivot.",
      supportNote: "The original-pivot flows are almost gone. The substitute pivot is now riding substitute-support flows from a false basin while the shell still looks polished.",
      recency: { status: "Wrong pivot", shell: 1.0, core: 0.08, links: 0.06, drift: 0.48, rupture: 0.92 },
      guarded: { status: "Protected", shell: 0.62, core: 0.86, links: 0.92, drift: 0.03, rupture: 0.08 },
    },
  ];

  const DEFAULT_VIEWS = {
    recency: { yaw: -0.18, pitch: 1.05 },
    guarded: { yaw: 0.18, pitch: 1.03 },
  };

  const canvas = document.getElementById("mapCanvas");
  const stage = document.querySelector(".stage");
  const context = canvas.getContext("2d");

  function isDark() {
    return document.documentElement.dataset.theme === "dark";
  }
  const slider = document.getElementById("checkpointSlider");
  const reliefSlider = document.getElementById("reliefSlider");
  const contrastSlider = document.getElementById("contrastSlider");
  const checkpointLabel = document.getElementById("checkpointLabel");
  const figureCheckpointTitle = document.getElementById("figureCheckpointTitle");
  const checkpointTitle = document.getElementById("checkpointTitle");
  const checkpointSummary = document.getElementById("checkpointSummary");
  const supportSummary = document.getElementById("supportSummary");
  const stepButtons = Array.from(document.querySelectorAll(".slider-label"));
  const recencyStatus = document.getElementById("recencyStatus");
  const guardedStatus = document.getElementById("guardedStatus");
  const viewMode3dButton = document.getElementById("viewMode3d");
  const viewMode2dButton = document.getElementById("viewMode2d");
  const impactHint = document.getElementById("impactHint");
  const openExperiment = document.getElementById("openExperiment");
  const closeExperiment = document.getElementById("closeExperiment");
  const experimentModal = document.getElementById("experimentModal");

  const TASK_LABEL = "Original pivot";

  const state = {
    currentIndex: 2,
    targetIndex: 2,
    time: 0,
    viewMode: "3d",
    recency: { ...checkpoints[2].recency },
    guarded: { ...checkpoints[2].guarded },
    relief: Number(reliefSlider.value) / 100,
    targetRelief: Number(reliefSlider.value) / 100,
    contrast: Number(contrastSlider.value) / 100,
    targetContrast: Number(contrastSlider.value) / 100,
    plates: {
      recency: { ...DEFAULT_VIEWS.recency, targetYaw: DEFAULT_VIEWS.recency.yaw, targetPitch: DEFAULT_VIEWS.recency.pitch },
      guarded: { ...DEFAULT_VIEWS.guarded, targetYaw: DEFAULT_VIEWS.guarded.yaw, targetPitch: DEFAULT_VIEWS.guarded.pitch },
    },
    tagPlacements: {},
    drag: {
      activePlate: null,
      pointerId: null,
      lastX: 0,
      lastY: 0,
    },
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(current, target, factor) {
    return current + (target - current) * factor;
  }

  function mixPoint(a, b, t) {
    return {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
      z: lerp(a.z, b.z, t),
    };
  }

  function rgba(rgb, alpha) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  }

  function quadraticPoint(start, control, end, t) {
    const oneMinusT = 1 - t;
    return {
      x: oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * control.x + t * t * end.x,
      y: oneMinusT * oneMinusT * start.y + 2 * oneMinusT * t * control.y + t * t * end.y,
    };
  }

  function getResultLabel(resultBlend) {
    if (resultBlend > 0.82) {
      return "Wrong pivot selected";
    }

    if (resultBlend > 0.52) {
      return "Pivot drifting";
    }

    return "";
  }

  function syncViewModeUI() {
    const is3d = state.viewMode === "3d";
    viewMode3dButton.classList.toggle("is-active", is3d);
    viewMode2dButton.classList.toggle("is-active", !is3d);
    viewMode3dButton.setAttribute("aria-pressed", String(is3d));
    viewMode2dButton.setAttribute("aria-pressed", String(!is3d));
    canvas.classList.toggle("is-flat", !is3d);
    impactHint.textContent = is3d
      ? "Drag either plate to rotate it. Support relief deepens predecessor-support basins; drift emphasis widens the visible split between the original and substitute pivots."
      : "2D mode restores a full contour map. Support relief opens the support stacks; drift emphasis sharpens the original-pivot versus substitute-pivot split.";
  }

  function syncCheckpointUI() {
    stepButtons.forEach((button) => {
      const active = Number(button.dataset.step) === state.targetIndex;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setCheckpoint(index) {
    state.targetIndex = clamp(index, 0, checkpoints.length - 1);
    slider.value = String(state.targetIndex);
    syncCheckpointUI();
  }

  function isStackedLayout(width) {
    return width < 560;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function blendState() {
    const target = checkpoints[state.targetIndex];
    ["shell", "core", "links", "drift", "rupture"].forEach((key) => {
      state.recency[key] = lerp(state.recency[key], target.recency[key], 0.08);
      state.guarded[key] = lerp(state.guarded[key], target.guarded[key], 0.08);
    });

    if (Math.abs(state.currentIndex - state.targetIndex) > 0.001) {
      state.currentIndex = lerp(state.currentIndex, state.targetIndex, 0.12);
    } else {
      state.currentIndex = state.targetIndex;
    }

    state.relief = lerp(state.relief, state.targetRelief, 0.1);
    state.contrast = lerp(state.contrast, state.targetContrast, 0.1);

    Object.values(state.plates).forEach((view) => {
      view.yaw = lerp(view.yaw, view.targetYaw, 0.14);
      view.pitch = lerp(view.pitch, view.targetPitch, 0.14);
    });

    checkpointLabel.textContent = target.label;
    figureCheckpointTitle.textContent = target.title;
    checkpointTitle.textContent = target.title;
    checkpointSummary.textContent = target.summary;
    supportSummary.textContent = target.supportNote;
    recencyStatus.textContent = target.recency.status;
    guardedStatus.textContent = target.guarded.status;
  }

  function drawBackground(width, height) {
    const dark = isDark();
    const gradient = context.createLinearGradient(0, 0, 0, height);
    if (dark) {
      gradient.addColorStop(0, "rgba(20, 24, 32, 0.95)");
      gradient.addColorStop(0.55, "rgba(16, 20, 28, 0.85)");
      gradient.addColorStop(1, "rgba(12, 15, 22, 0.75)");
    } else {
      gradient.addColorStop(0, "rgba(255,255,255,0.42)");
      gradient.addColorStop(0.55, "rgba(248, 242, 232, 0.22)");
      gradient.addColorStop(1, "rgba(212, 201, 184, 0.14)");
    }
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.save();

    const leftGlow = context.createRadialGradient(width * 0.28, height * 0.58, 0, width * 0.28, height * 0.58, width * 0.3);
    leftGlow.addColorStop(0, dark ? "rgba(212, 108, 85, 0.08)" : "rgba(212, 108, 85, 0.12)");
    leftGlow.addColorStop(1, "rgba(212, 108, 85, 0)");
    context.fillStyle = leftGlow;
    context.fillRect(0, 0, width, height);

    const rightGlow = context.createRadialGradient(width * 0.72, height * 0.58, 0, width * 0.72, height * 0.58, width * 0.3);
    rightGlow.addColorStop(0, dark ? "rgba(35, 120, 154, 0.1)" : "rgba(35, 120, 154, 0.13)");
    rightGlow.addColorStop(1, "rgba(35, 120, 154, 0)");
    context.fillStyle = rightGlow;
    context.fillRect(0, 0, width, height);

    context.strokeStyle = dark ? "rgba(255, 255, 255, 0.06)" : "rgba(20, 24, 31, 0.05)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(width / 2, height * 0.14);
    context.lineTo(width / 2, height * 0.86);
    context.stroke();

    context.restore();
  }

  function contourLocalPoint(t, radius, drift, distortion, phase, wobbleX, wobbleY) {
    const noise =
      1 +
      distortion * 0.18 * Math.sin(t * 3 + phase) +
      distortion * 0.1 * Math.cos(t * 5 - phase * 0.7) +
      distortion * 0.05 * Math.sin(t * 8 + phase * 0.35);

    return {
      x: Math.cos(t) * radius * noise * (1 + wobbleX) + Math.sin(t * 2 + phase) * drift * radius * 0.45,
      y:
        Math.sin(t) * radius * 0.88 * noise * (1 + wobbleY) +
        Math.cos(t * 3 - phase) * drift * radius * 0.18,
    };
  }

  function contourLocalPoint2d(t, radius, drift, distortion, phase, profile = {}) {
    const substitutePull = profile.substitutePull || 0;
    const supportSkew = profile.supportSkew || 0;
    const bandBias = profile.bandBias || 0;
    const substituteCenter = -0.34;
    const supportCenter = 2.28;
    const substituteDelta = Math.atan2(Math.sin(t - substituteCenter), Math.cos(t - substituteCenter));
    const supportDelta = Math.atan2(Math.sin(t - supportCenter), Math.cos(t - supportCenter));
    const substitutePocket = Math.exp(-(substituteDelta * substituteDelta) / (0.24 + substitutePull * 0.16));
    const supportPocket = Math.exp(-(supportDelta * supportDelta) / (0.34 + supportSkew * 0.16));
    const radialNoise =
      1 +
      distortion * 0.082 * Math.sin(t * 3 + phase) +
      distortion * 0.052 * Math.cos(t * 5 - phase * 0.6) +
      bandBias * 0.034 * Math.sin(t * 4 - phase * 0.18) -
      substitutePocket * (0.08 + substitutePull * 0.16) +
      supportPocket * (0.028 + supportSkew * 0.06);

    return {
      x:
        Math.cos(t) * radius * radialNoise +
        drift * radius * (0.24 + substitutePull * 0.1) +
        distortion * radius * 0.052 * Math.cos(t * 2 + phase * 0.25) +
        substitutePocket * radius * (0.08 + substitutePull * 0.16) -
        supportPocket * radius * (0.02 + supportSkew * 0.03),
      y:
        Math.sin(t) * radius * 0.84 * (1 + distortion * 0.048 * Math.cos(t * 2 - phase * 0.3)) +
        drift * radius * 0.052 * Math.sin(t + phase * 0.25) -
        substitutePocket * radius * (0.045 + substitutePull * 0.06) +
        supportPocket * radius * (0.012 + supportSkew * 0.018),
    };
  }

  function projectPoint(centerX, centerY, point, view) {
    if (state.viewMode === "2d") {
      return {
        x: centerX + point.x * 1.02,
        y: centerY + point.y * 0.86,
        depth: point.z,
      };
    }

    const cosYaw = Math.cos(view.yaw);
    const sinYaw = Math.sin(view.yaw);
    const rotatedX = point.x * cosYaw - point.y * sinYaw;
    const rotatedY = point.x * sinYaw + point.y * cosYaw;

    const cosPitch = Math.cos(view.pitch);
    const sinPitch = Math.sin(view.pitch);
    const screenY = rotatedY * cosPitch - point.z * sinPitch;
    const depth = rotatedY * sinPitch + point.z * cosPitch;
    const perspective = 1 + depth * 0.00115;

    return {
      x: centerX + rotatedX * perspective,
      y: centerY + screenY,
      depth,
    };
  }

  function buildContourPoints(centerX, centerY, radius, drift, distortion, phase, wobbleX, wobbleY, elevation, view, profile) {
    const points = [];

    for (let step = 0; step <= 160; step += 1) {
      const t = (step / 160) * Math.PI * 2;
      const local =
        state.viewMode === "2d"
          ? contourLocalPoint2d(t, radius, drift, distortion, phase, profile)
          : contourLocalPoint(t, radius, drift, distortion, phase, wobbleX, wobbleY);
      points.push(projectPoint(centerX, centerY, { ...local, z: elevation }, view));
    }

    return points;
  }

  function buildOffsetContourPoints(centerX, centerY, localCenter, radius, drift, distortion, phase, wobbleX, wobbleY, elevation, view) {
    const points = [];

    for (let step = 0; step <= 160; step += 1) {
      const t = (step / 160) * Math.PI * 2;
      const local =
        state.viewMode === "2d"
          ? contourLocalPoint2d(t, radius, drift, distortion, phase)
          : contourLocalPoint(t, radius, drift, distortion, phase, wobbleX, wobbleY);
      points.push(
        projectPoint(
          centerX,
          centerY,
          {
            x: localCenter.x + local.x,
            y: localCenter.y + local.y,
            z: localCenter.z + elevation,
          },
          view
        )
      );
    }

    return points;
  }

  function tracePoints(points) {
    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });
    context.closePath();
  }

  function fillBand(outerPoints, innerPoints) {
    context.beginPath();
    outerPoints.forEach((point, index) => {
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });

    for (let index = innerPoints.length - 1; index >= 0; index -= 1) {
      context.lineTo(innerPoints[index].x, innerPoints[index].y);
    }

    context.closePath();
  }

  function buildSupportAnchors(basinLocal, shellRadius, liftScale) {
    return [
      { x: basinLocal.x - shellRadius * 0.16, y: basinLocal.y - shellRadius * 0.06, z: basinLocal.z + liftScale * 0.02 },
      { x: basinLocal.x, y: basinLocal.y - shellRadius * 0.1, z: basinLocal.z + liftScale * 0.03 },
      { x: basinLocal.x + shellRadius * 0.16, y: basinLocal.y - shellRadius * 0.06, z: basinLocal.z + liftScale * 0.02 },
    ];
  }

  function drawSupportBasin(centerX, centerY, basinLocal, shellRadius, integrity, palette, view) {
    const glowCenter = projectPoint(centerX, centerY, basinLocal, view);
    const ringCount = state.viewMode === "3d" ? 3 : 4;
    const baseRadius = shellRadius * (state.viewMode === "3d" ? 0.16 : 0.18) * (0.64 + integrity * 0.34 + state.relief * 0.22);

    context.save();

    const glow = context.createRadialGradient(glowCenter.x, glowCenter.y, 0, glowCenter.x, glowCenter.y, shellRadius * 0.54);
    glow.addColorStop(0, rgba(palette.link, 0.18 + integrity * 0.12));
    glow.addColorStop(1, rgba(palette.link, 0));
    context.globalAlpha = 0.42 + integrity * 0.18;
    context.fillStyle = glow;
    context.beginPath();
    context.arc(glowCenter.x, glowCenter.y, shellRadius * 0.46, 0, Math.PI * 2);
    context.fill();

    const basinFill = buildOffsetContourPoints(
      centerX,
      centerY,
      basinLocal,
      baseRadius * 1.1,
      integrity * (state.viewMode === "3d" ? 0.06 : 0.03),
      integrity * (state.viewMode === "3d" ? 0.12 : 0.045),
      state.time * 0.12 + 0.5,
      state.viewMode === "3d" ? 0.025 : 0.01,
      state.viewMode === "3d" ? 0.012 : 0.005,
      state.viewMode === "3d" ? -2 : 0,
      view
    );
    context.globalAlpha = 0.14 + integrity * 0.12;
    context.fillStyle = rgba(palette.link, 0.11);
    tracePoints(basinFill);
    context.fill();

    for (let index = ringCount - 1; index >= 0; index -= 1) {
      const ratio = index / Math.max(1, ringCount - 1);
      const ringPoints = buildOffsetContourPoints(
        centerX,
        centerY,
        basinLocal,
        baseRadius * (0.58 + ratio * 0.74),
        integrity * (state.viewMode === "3d" ? 0.08 : 0.035),
        integrity * (state.viewMode === "3d" ? 0.14 : 0.05),
        state.time * 0.12 + ratio * 1.1,
        state.viewMode === "3d" ? 0.028 : 0.012,
        state.viewMode === "3d" ? 0.014 : 0.005,
        (state.viewMode === "3d" ? -1 : 0) * ratio,
        view
      );

      context.setLineDash([]);
      context.lineWidth = state.viewMode === "3d" ? 1.2 - ratio * 0.18 : 1.04 - ratio * 0.14;
      context.globalAlpha = 0.14 + integrity * (state.viewMode === "3d" ? 0.18 : 0.1) + (1 - ratio) * 0.05;
      context.strokeStyle = rgba(palette.link, 0.52 + integrity * 0.22);
      tracePoints(ringPoints);
      context.stroke();
    }

    context.setLineDash([]);
    context.globalAlpha = 0.4 + integrity * 0.2;
    context.fillStyle = rgba(palette.link, 0.72);
    context.beginPath();
    context.arc(glowCenter.x, glowCenter.y, 2.8 + integrity * 2.1, 0, Math.PI * 2);
    context.fill();

    context.restore();
  }

  function drawSupportFlows(centerX, centerY, anchors, targetLocal, integrity, tone, view) {
    const projectedTarget = projectPoint(centerX, centerY, targetLocal, view);

    context.save();
    context.strokeStyle = tone;
    context.fillStyle = tone;

    anchors.forEach((anchor, index) => {
      const visible = Math.max(0, integrity - index * 0.12);
      if (visible <= 0.04) {
        return;
      }

      const projectedAnchor = projectPoint(centerX, centerY, anchor, view);
      const midX = lerp(projectedAnchor.x, projectedTarget.x, 0.48) + (index - 1) * 8 * visible;
      const midY =
        lerp(projectedAnchor.y, projectedTarget.y, 0.52) -
        (20 + index * 7) * (0.72 + state.relief * 0.52) * visible +
        Math.sin(state.time * 1.5 + index * 0.84) * (state.viewMode === "3d" ? 4.4 : 1.8);

      context.beginPath();
      context.globalAlpha = 0.06 + visible * (0.08 + state.relief * 0.06);
      context.lineWidth = (10 + state.relief * 5) * visible;
      context.moveTo(projectedAnchor.x, projectedAnchor.y);
      context.quadraticCurveTo(midX, midY, projectedTarget.x, projectedTarget.y);
      context.stroke();

      context.beginPath();
      context.globalAlpha = 0.12 + visible * 0.18;
      context.lineWidth = (5.6 + state.relief * 2.2) * visible;
      context.moveTo(projectedAnchor.x, projectedAnchor.y);
      context.quadraticCurveTo(midX, midY, projectedTarget.x, projectedTarget.y);
      context.stroke();

      context.beginPath();
      context.globalAlpha = 0.36 + visible * 0.28;
      context.lineWidth = 1.15 + visible * 1.6;
      context.moveTo(projectedAnchor.x, projectedAnchor.y);
      context.quadraticCurveTo(midX, midY, projectedTarget.x, projectedTarget.y);
      context.stroke();

      for (let pulseIndex = 0; pulseIndex < 2; pulseIndex += 1) {
        const travel = (state.time * (0.18 + index * 0.02) + pulseIndex * 0.34 + index * 0.13) % 1;
        const pulsePoint = quadraticPoint(projectedAnchor, { x: midX, y: midY }, projectedTarget, travel);
        const pulseRadius = (1.6 + visible * (2.1 + state.relief)) * (1 - travel * 0.18);

        context.beginPath();
        context.globalAlpha = 0.12 + visible * 0.18;
        context.arc(pulsePoint.x, pulsePoint.y, pulseRadius * 1.8, 0, Math.PI * 2);
        context.fill();

        context.beginPath();
        context.globalAlpha = 0.34 + visible * 0.22;
        context.arc(pulsePoint.x, pulsePoint.y, pulseRadius, 0, Math.PI * 2);
        context.fill();
      }

      context.beginPath();
      context.globalAlpha = 0.3 + visible * 0.22;
      context.arc(projectedAnchor.x, projectedAnchor.y, 2.2 + visible * 1.2, 0, Math.PI * 2);
      context.fill();
    });

    context.restore();
    return projectedTarget;
  }

  function drawSubstituteBasin(centerX, centerY, basinLocal, shellRadius, severity, palette, view) {
    const glowCenter = projectPoint(centerX, centerY, basinLocal, view);
    const ringCount = state.viewMode === "3d" ? 2 : 3;
    const baseRadius = shellRadius * (state.viewMode === "3d" ? 0.125 : 0.135) * (0.8 + severity * 0.28 + state.contrast * 0.18);

    context.save();

    const glow = context.createRadialGradient(glowCenter.x, glowCenter.y, 0, glowCenter.x, glowCenter.y, shellRadius * 0.42);
    glow.addColorStop(0, rgba(palette.outer, 0.18 + severity * 0.12));
    glow.addColorStop(1, rgba(palette.outer, 0));
    context.globalAlpha = 0.5 + severity * 0.24;
    context.fillStyle = glow;
    context.beginPath();
    context.arc(glowCenter.x, glowCenter.y, shellRadius * 0.4, 0, Math.PI * 2);
    context.fill();

    const basinFill = buildOffsetContourPoints(
      centerX,
      centerY,
      basinLocal,
      baseRadius * 1.12,
      severity * (state.viewMode === "3d" ? 0.05 : 0.03),
      severity * (state.viewMode === "3d" ? 0.12 : 0.05),
      state.time * 0.14 + 0.9,
      state.viewMode === "3d" ? 0.03 : 0.01,
      state.viewMode === "3d" ? 0.015 : 0.006,
      state.viewMode === "3d" ? -2 : 0,
      view
    );
    context.globalAlpha = 0.16 + severity * 0.12;
    context.fillStyle = rgba(palette.break, 0.1);
    tracePoints(basinFill);
    context.fill();

    for (let index = ringCount - 1; index >= 0; index -= 1) {
      const ratio = index / Math.max(1, ringCount - 1);
      const ringPoints = buildOffsetContourPoints(
        centerX,
        centerY,
        basinLocal,
        baseRadius * (0.56 + ratio * 0.76),
        severity * (state.viewMode === "3d" ? 0.06 : 0.035),
        severity * (state.viewMode === "3d" ? 0.12 : 0.05),
        state.time * 0.14 + ratio * 1.2,
        state.viewMode === "3d" ? 0.03 : 0.012,
        state.viewMode === "3d" ? 0.015 : 0.006,
        (state.viewMode === "3d" ? -1 : 0) * ratio,
        view
      );

      context.setLineDash(index === ringCount - 1 ? [4, 5] : []);
      context.lineWidth = state.viewMode === "3d" ? 1.15 - ratio * 0.18 : 1 - ratio * 0.14;
      context.globalAlpha = 0.14 + severity * (state.viewMode === "3d" ? 0.16 : 0.1) + (1 - ratio) * 0.04;
      context.strokeStyle = rgba(palette.break, 0.55 + severity * 0.22);
      tracePoints(ringPoints);
      context.stroke();
    }

    context.setLineDash([]);
    context.globalAlpha = 0.42 + severity * 0.22;
    context.fillStyle = rgba(palette.break, 0.72);
    context.beginPath();
    context.arc(glowCenter.x, glowCenter.y, 2.6 + severity * 2.2, 0, Math.PI * 2);
    context.fill();

    context.restore();
  }

  function drawSubstituteFlows(centerX, centerY, anchors, resultLocal, severity, tone, view) {
    const projectedResult = projectPoint(centerX, centerY, resultLocal, view);

    context.save();
    context.strokeStyle = tone;
    context.fillStyle = tone;

    anchors.forEach((anchor, index) => {
      const projectedAnchor = projectPoint(centerX, centerY, anchor, view);
      const midX = lerp(projectedAnchor.x, projectedResult.x, 0.48) + 12 * severity + index * 8;
      const midY = lerp(projectedAnchor.y, projectedResult.y, 0.58) - 10 * severity + index * 5;

      context.beginPath();
      context.setLineDash([5, 6]);
      context.globalAlpha = 0.08 + severity * 0.18;
      context.lineWidth = 3.2 + severity * 2.2;
      context.moveTo(projectedAnchor.x, projectedAnchor.y);
      context.quadraticCurveTo(midX, midY, projectedResult.x, projectedResult.y);
      context.stroke();

      context.beginPath();
      context.setLineDash([3, 5]);
      context.globalAlpha = 0.3 + severity * 0.18;
      context.lineWidth = 1 + severity * 0.8;
      context.moveTo(projectedAnchor.x, projectedAnchor.y);
      context.quadraticCurveTo(midX, midY, projectedResult.x, projectedResult.y);
      context.stroke();

      const travel = (state.time * 0.22 + index * 0.24) % 1;
      const pulsePoint = quadraticPoint(projectedAnchor, { x: midX, y: midY }, projectedResult, travel);
      context.beginPath();
      context.setLineDash([]);
      context.globalAlpha = 0.2 + severity * 0.16;
      context.arc(pulsePoint.x, pulsePoint.y, 1.8 + severity * 1.6, 0, Math.PI * 2);
      context.fill();
    });

    context.restore();
  }

  function measureTaskTag(text) {
    const padX = 10;
    const radius = 10;
    const accentGap = 11;
    const boxHeight = 28;

    context.save();
    context.font = "600 13px Helvetica Neue, Arial, sans-serif";
    const textWidth = context.measureText(text).width;
    context.restore();

    return {
      text,
      padX,
      radius,
      accentGap,
      boxHeight,
      boxWidth: textWidth + padX * 2 + accentGap,
    };
  }

  function rectOverlapArea(a, b) {
    const overlapX = Math.max(0, Math.min(a.boxX + a.boxWidth, b.boxX + b.boxWidth) - Math.max(a.boxX, b.boxX));
    const overlapY = Math.max(0, Math.min(a.boxY + a.boxHeight, b.boxY + b.boxHeight) - Math.max(a.boxY, b.boxY));
    return overlapX * overlapY;
  }

  function buildTagPlacement(anchorX, anchorY, metrics, position) {
    const gapX = 18;
    const gapY = 14;
    const { boxWidth, boxHeight } = metrics;
    let boxX = anchorX + gapX;
    let boxY = anchorY - boxHeight / 2;
    let side = "left";

    switch (position) {
      case "top-left":
        boxX = anchorX - boxWidth - gapX;
        boxY = anchorY - boxHeight - gapY;
        side = "right";
        break;
      case "top-right":
        boxX = anchorX + gapX;
        boxY = anchorY - boxHeight - gapY;
        side = "left";
        break;
      case "bottom-left":
        boxX = anchorX - boxWidth - gapX;
        boxY = anchorY + gapY;
        side = "right";
        break;
      case "bottom-right":
        boxX = anchorX + gapX;
        boxY = anchorY + gapY;
        side = "left";
        break;
      case "left":
        boxX = anchorX - boxWidth - gapX;
        boxY = anchorY - boxHeight / 2;
        side = "right";
        break;
      case "right":
        boxX = anchorX + gapX;
        boxY = anchorY - boxHeight / 2;
        side = "left";
        break;
      case "top":
        boxX = anchorX - boxWidth / 2;
        boxY = anchorY - boxHeight - gapY;
        side = "center";
        break;
      default:
        break;
    }

    return {
      ...metrics,
      boxX,
      boxY,
      anchorX,
      anchorY,
      side,
      lineStartX:
        side === "right" ? boxX + boxWidth : side === "left" ? boxX : clamp(anchorX, boxX + 8, boxX + boxWidth - 8),
      lineStartY: clamp(anchorY, boxY + 6, boxY + boxHeight - 6),
    };
  }

  function chooseTaskTagPlacement(anchorX, anchorY, text, preferences, occupiedBoxes, bounds, currentPlacement) {
    const metrics = measureTaskTag(text);
    let bestPlacement = null;
    let bestScore = Number.POSITIVE_INFINITY;

    preferences.forEach((position, index) => {
      const candidate = buildTagPlacement(anchorX, anchorY, metrics, position);
      const overflow =
        Math.max(0, bounds.left - candidate.boxX) +
        Math.max(0, candidate.boxX + candidate.boxWidth - bounds.right) +
        Math.max(0, bounds.top - candidate.boxY) +
        Math.max(0, candidate.boxY + candidate.boxHeight - bounds.bottom);
      const overlap = occupiedBoxes.reduce((sum, occupied) => sum + rectOverlapArea(candidate, occupied), 0);
      const travel = Math.hypot(
        candidate.boxX + candidate.boxWidth / 2 - anchorX,
        candidate.boxY + candidate.boxHeight / 2 - anchorY
      );
      const continuity = currentPlacement
        ? Math.hypot(candidate.boxX - currentPlacement.boxX, candidate.boxY - currentPlacement.boxY)
        : 0;
      const sidePenalty = currentPlacement && candidate.side !== currentPlacement.side ? 10 : 0;
      const score = overflow * 80 + overlap * 1.8 + travel * 0.18 + continuity * 0.14 + sidePenalty + index * 12;

      if (score < bestScore) {
        bestScore = score;
        bestPlacement = candidate;
      }
    });

    return bestPlacement;
  }

  function animateTaskPlacement(key, targetPlacement) {
    const currentPlacement = state.tagPlacements[key];

    if (!currentPlacement || currentPlacement.text !== targetPlacement.text) {
      const seeded = { ...targetPlacement };
      state.tagPlacements[key] = seeded;
      return seeded;
    }

    const animated = {
      ...targetPlacement,
      boxX: lerp(currentPlacement.boxX, targetPlacement.boxX, 0.16),
      boxY: lerp(currentPlacement.boxY, targetPlacement.boxY, 0.16),
      lineStartX: lerp(currentPlacement.lineStartX, targetPlacement.lineStartX, 0.2),
      lineStartY: lerp(currentPlacement.lineStartY, targetPlacement.lineStartY, 0.2),
      anchorX: lerp(currentPlacement.anchorX, targetPlacement.anchorX, 0.26),
      anchorY: lerp(currentPlacement.anchorY, targetPlacement.anchorY, 0.26),
    };

    state.tagPlacements[key] = animated;
    return animated;
  }

  function drawTaskTag(placement, tone, lineStyle) {
    const { boxX, boxY, boxWidth, boxHeight, radius, padX, accentGap, lineStartX, lineStartY, anchorX, anchorY, side, text } = placement;
    const labelY = boxY + boxHeight / 2;

    context.save();
    context.font = "600 13px Helvetica Neue, Arial, sans-serif";

    context.beginPath();
    context.moveTo(boxX + radius, boxY);
    context.lineTo(boxX + boxWidth - radius, boxY);
    context.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
    context.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
    context.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
    context.lineTo(boxX + radius, boxY + boxHeight);
    context.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
    context.lineTo(boxX, boxY + radius);
    context.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
    context.closePath();
    const dark = isDark();
    context.fillStyle = dark ? "rgba(20, 24, 32, 0.92)" : "rgba(250, 246, 239, 0.98)";
    context.strokeStyle = dark ? "rgba(255, 255, 255, 0.12)" : "rgba(20, 24, 31, 0.12)";
    context.lineWidth = 1;
    context.fill();
    context.stroke();

    context.fillStyle = tone;
    context.beginPath();
    context.arc(boxX + padX + 3.5, labelY, 3.4, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = dark ? "rgba(240, 238, 232, 0.9)" : "rgba(20, 24, 31, 0.84)";
    context.textBaseline = "middle";
    context.fillText(text, boxX + padX + accentGap, labelY + 0.5);

    context.strokeStyle = tone;
    context.lineWidth = lineStyle === "dashed" ? 1 : 1.05;
    context.globalAlpha = lineStyle === "dashed" ? 0.48 : 0.38;
    context.setLineDash(lineStyle === "dashed" ? [4, 4] : []);
    context.beginPath();
    context.moveTo(lineStartX, lineStartY);
    context.quadraticCurveTo(
      lerp(lineStartX, anchorX, 0.5) + (side === "left" ? 10 : side === "right" ? -10 : 0),
      lerp(lineStartY, anchorY, 0.5) - Math.sign(lineStartY - anchorY || 1) * 8,
      anchorX,
      anchorY
    );
    context.stroke();
    context.restore();

    return placement;
  }

  function drawCore(corePoint, strength, tone, fill) {
    context.save();

    const glow = context.createRadialGradient(corePoint.x, corePoint.y, 0, corePoint.x, corePoint.y, 34);
    glow.addColorStop(0, fill);
    glow.addColorStop(1, "rgba(255,255,255,0)");

    context.globalAlpha = 0.22 + strength * 0.44;
    context.fillStyle = glow;
    context.beginPath();
    context.arc(corePoint.x, corePoint.y, 34, 0, Math.PI * 2);
    context.fill();

    context.globalAlpha = 1;
    context.fillStyle = fill;
    context.beginPath();
    context.arc(corePoint.x, corePoint.y, 6 + strength * 5, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = tone;
    context.lineWidth = 1.55;
    context.globalAlpha = 0.64 + strength * 0.28;
    context.beginPath();
    context.arc(corePoint.x, corePoint.y, 13 + strength * 9, 0, Math.PI * 2);
    context.stroke();

    context.restore();
  }

  function drawResultMarker(point, tone, fill, emphasis) {
    const size = 6 + emphasis * 4;

    context.save();
    context.translate(point.x, point.y);
    context.rotate(Math.PI / 4);

    context.globalAlpha = 0.22 + emphasis * 0.28;
    context.fillStyle = fill;
    context.fillRect(-size * 1.4, -size * 1.4, size * 2.8, size * 2.8);

    context.globalAlpha = 1;
    context.fillStyle = tone;
    context.fillRect(-size, -size, size * 2, size * 2);

    context.strokeStyle = "rgba(255, 253, 249, 0.92)";
    context.lineWidth = 1.2;
    context.strokeRect(-size, -size, size * 2, size * 2);
    context.restore();
  }

  function drawAxisGuide(centerX, centerY, shellRadius, view, selectionBlend, palette) {
    const compact = canvas.clientWidth < 700;
    const baselineLeft = projectPoint(centerX, centerY, { x: -shellRadius * 0.92, y: shellRadius * 1.12, z: 0 }, view);
    const baselineRight = projectPoint(centerX, centerY, { x: shellRadius * 0.92, y: shellRadius * 1.12, z: 0 }, view);
    const baselineY = Math.max(baselineLeft.y, baselineRight.y);
    const axisStartX = lerp(baselineLeft.x, baselineRight.x, 0.12);
    const axisEndX = lerp(baselineLeft.x, baselineRight.x, 0.88);
    const axisMidX = (axisStartX + axisEndX) / 2;
    const selectedX = lerp(axisStartX, axisEndX, clamp(selectionBlend, 0, 1));

    const dark = isDark();
    context.save();
    context.strokeStyle = dark ? "rgba(255, 255, 255, 0.1)" : "rgba(20, 24, 31, 0.07)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(axisStartX, baselineY);
    context.lineTo(axisEndX, baselineY);
    context.stroke();

    context.beginPath();
    context.arc(axisStartX, baselineY, 2.4, 0, Math.PI * 2);
    context.arc(axisEndX, baselineY, 2.4, 0, Math.PI * 2);
    context.fillStyle = dark ? "rgba(255, 255, 255, 0.15)" : "rgba(20, 24, 31, 0.1)";
    context.fill();

    context.beginPath();
    context.fillStyle = rgba(palette.break, 0.9);
    context.arc(selectedX, baselineY, compact ? 2.8 : 3.2, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = dark ? "rgba(200, 208, 218, 0.9)" : "rgba(77, 86, 96, 0.9)";
    context.font = compact ? "600 10px Helvetica Neue, Arial, sans-serif" : "600 11px Helvetica Neue, Arial, sans-serif";
    context.textBaseline = "middle";

    if (!compact) {
      context.textAlign = "center";
      context.fillText("selected pivot", axisMidX, baselineY - 12);
    }

    context.textAlign = "left";
    context.fillText(compact ? "original" : "original pivot", axisStartX - 4, baselineY + 16);

    context.textAlign = "right";
    context.fillText(compact ? "substitute" : "substitute pivot", axisEndX + 4, baselineY + 16);

    context.restore();
  }

  function drawMap(centerX, centerY, sideWidth, config, palette, view, role) {
    const is3d = state.viewMode === "3d";
    const reliefScale = (is3d ? 28 + config.shell * 42 : 10 + config.shell * 16) * (is3d ? 0.44 + state.relief * 1.38 : 0.82 + state.relief * 0.68);
    const contrastBoost = 0.8 + state.contrast * 1.04;
    const separationBoost = 0.58 + state.contrast * 1.28;
    const shellRadius = sideWidth * (is3d ? 0.21 + config.shell * 0.12 : 0.22 + config.shell * 0.11);
    const motionPhase = is3d
      ? state.time * (role === "recency" ? 0.95 : 0.82) + (role === "recency" ? 0 : 1.7)
      : (role === "recency" ? config.rupture * 0.72 : 1.7 + config.rupture * 0.14);
    const liveView =
      is3d
        ? {
            yaw: view.yaw + Math.sin(motionPhase) * 0.05 + Math.cos(motionPhase * 0.44) * 0.016,
            pitch: view.pitch + Math.cos(motionPhase * 0.86) * 0.036,
          }
        : { yaw: 0, pitch: 0 };
    const surfaceShift = role === "recency" ? config.drift * (0.72 + state.contrast * 0.42) : config.drift * 0.12;
    const coreLocal = {
      x: -shellRadius * (role === "recency" ? 0.08 : 0.06),
      y: shellRadius * 0.02,
      z: reliefScale * (0.3 + config.core * 0.64),
    };
    const substituteLocal = {
      x: shellRadius * (0.4 + separationBoost * 0.24 + config.rupture * 0.12),
      y: -shellRadius * (0.08 + config.rupture * 0.12),
      z: reliefScale * (0.18 + config.shell * 0.16),
    };
    const resultBlend = role === "recency" ? clamp(config.rupture * 1.18 + (1 - config.core) * 0.18, 0, 1) : clamp(config.rupture * 0.18, 0, 0.18);
    const displayedBlend = role === "recency" ? clamp(resultBlend * (0.68 + state.contrast * 0.58), 0, 1) : clamp(resultBlend * 0.46, 0, 0.12);
    const resultLocal = mixPoint(
      { x: coreLocal.x, y: coreLocal.y - shellRadius * 0.04, z: coreLocal.z },
      substituteLocal,
      displayedBlend
    );
    const originalSupportLocal = {
      x: -shellRadius * (0.74 + state.contrast * 0.08),
      y: shellRadius * (0.8 + config.rupture * 0.02),
      z: reliefScale * (is3d ? 0.04 : 0),
    };
    const originalSupportAnchors = buildSupportAnchors(originalSupportLocal, shellRadius, reliefScale);
    const substituteSupportLocal = {
      x: shellRadius * (0.66 + separationBoost * 0.22 + config.rupture * 0.08),
      y: shellRadius * (0.78 + config.rupture * 0.04),
      z: reliefScale * (is3d ? 0.04 : 0),
    };
    const substituteSupportAnchors = buildSupportAnchors(substituteSupportLocal, shellRadius * 0.72, reliefScale);
    const contourProfile =
      role === "recency"
        ? {
            substitutePull: config.rupture * (0.48 + state.contrast * 0.42),
            supportSkew: (1 - config.links) * 0.42 + config.drift * 0.18,
            bandBias: config.rupture * 0.34 + state.relief * 0.1,
          }
        : {
            substitutePull: config.rupture * 0.08,
            supportSkew: 0.06 + config.links * 0.04,
            bandBias: 0.05,
          };

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";

    const contours = [];
    const contourCount = is3d ? 11 + Math.round(state.relief * 2) : 13 + Math.round(state.relief * 2);

    for (let index = 0; index < contourCount; index += 1) {
      const ratio = index / (contourCount - 1);
      const radius = shellRadius * (1 - ratio * 0.72);
      const elevation =
        ratio * reliefScale +
        Math.sin(motionPhase * 1.55 + ratio * 3.6) * (1 - ratio) * (is3d ? 1.6 + state.relief * 3.1 : 0.3 + state.relief * 0.8) +
        Math.cos(motionPhase * 0.72 + ratio * 5.2) * (1 - ratio) * (is3d ? 0.9 : 0.18);
      contours.push({
        ratio,
        elevation,
        points: buildContourPoints(
          centerX,
          centerY,
          radius,
          surfaceShift * (is3d ? 0.16 + (1 - ratio) * 0.68 : 0.05 + (1 - ratio) * 0.12),
          config.rupture * (is3d ? 0.34 + (1 - ratio) * 0.94 : 0.14 + (1 - ratio) * 0.2) * (0.84 + state.contrast * (is3d ? 0.32 : 0.2)),
          (is3d ? state.time * 0.32 : 0.1) + ratio * 1.6 + config.rupture * 0.78,
          (1 - ratio) * (is3d ? 0.08 : 0.03) + config.rupture * (is3d ? 0.06 : 0.032),
          (1 - ratio) * (is3d ? 0.04 : 0.014),
          elevation,
          liveView,
          contourProfile
        ),
        strokeTone: ratio < 0.32 ? rgba(palette.outer, is3d ? 0.76 + state.contrast * 0.2 : 0.84 + state.contrast * 0.08) : rgba(palette.inner, is3d ? 0.42 + (1 - ratio) * 0.26 : 0.32 + (1 - ratio) * 0.2),
      });
    }

    if (is3d) {
      const basePoints = buildContourPoints(
        centerX,
        centerY,
        shellRadius * 1.02,
        surfaceShift * 0.16,
        config.rupture * 0.32 * (0.86 + state.contrast * 0.18),
        state.time * 0.22 + 0.4,
        0.03,
        0.02,
        -reliefScale * (0.56 + state.relief * 0.24),
        liveView,
        contourProfile
      );

      context.save();
      context.fillStyle = rgba(palette.shadow, 0.11 + state.relief * 0.1);
      fillBand(basePoints, contours[0].points);
      context.fill();

      context.globalAlpha = 0.16 + state.relief * 0.1;
      context.fillStyle = rgba(palette.shadow, 0.2);
      tracePoints(basePoints);
      context.fill();
      context.restore();

      context.save();
      context.globalAlpha = 0.14 + state.relief * 0.08;
      context.fillStyle = rgba(palette.shadow, 0.18);
      context.beginPath();
      contours[0].points.forEach((point, index) => {
        const shadowX = point.x + 8;
        const shadowY = point.y + reliefScale * 0.22;
        if (index === 0) {
          context.moveTo(shadowX, shadowY);
        } else {
          context.lineTo(shadowX, shadowY);
        }
      });
      context.closePath();
      context.fill();
      context.restore();
    }

    for (let index = 0; index < contours.length - 1; index += 1) {
      const outer = contours[index];
      const inner = contours[index + 1];
      const bandAlpha = is3d
        ? (0.12 + (1 - outer.ratio) * 0.14) * (0.84 + state.relief * 0.72)
        : 0.02 + (1 - outer.ratio) * 0.018;
      const bandTone = outer.ratio < 0.3 ? rgba(palette.outer, bandAlpha) : rgba(palette.inner, is3d ? bandAlpha * 0.86 : bandAlpha);

      context.fillStyle = bandTone;
      fillBand(outer.points, inner.points);
      context.fill();

      if (is3d) {
        context.strokeStyle = rgba(palette.shadow, 0.04 + (1 - outer.ratio) * 0.06);
        context.lineWidth = 2.4;
        tracePoints(outer.points);
        context.stroke();
      }
    }

    if (is3d) {
      const shellSkin = context.createLinearGradient(centerX, centerY - reliefScale * 1.14, centerX, centerY + shellRadius * 1.18);
      shellSkin.addColorStop(0, "rgba(255,255,255,0.34)");
      shellSkin.addColorStop(0.38, rgba(palette.outer, 0.11 + state.relief * 0.04));
      shellSkin.addColorStop(1, rgba(palette.shadow, 0.14));
      context.fillStyle = shellSkin;
      tracePoints(contours[0].points);
      context.fill();

      context.fillStyle = "rgba(255, 255, 255, 0.22)";
      tracePoints(contours[contours.length - 1].points);
      context.fill();

      const crest = projectPoint(
        centerX,
        centerY,
        {
          x: shellRadius * -0.08,
          y: -shellRadius * 0.12,
          z: reliefScale * 0.94,
        },
        liveView
      );
      const crestGlow = context.createRadialGradient(crest.x, crest.y, 0, crest.x, crest.y, shellRadius * 0.56);
      crestGlow.addColorStop(0, "rgba(255,255,255,0.34)");
      crestGlow.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = crestGlow;
      context.beginPath();
      context.arc(crest.x, crest.y, shellRadius * 0.56, 0, Math.PI * 2);
      context.fill();
    }

    contours.forEach((contour, index) => {
      if (is3d && index !== 0 && index !== contours.length - 1 && index % 2 === 1) {
        return;
      }

      const alpha = is3d
        ? (0.12 + (1 - contour.ratio) * 0.22) * contrastBoost
        : 0.34 + (1 - contour.ratio) * 0.22 + state.relief * 0.05;
      context.strokeStyle = contour.strokeTone;
      context.lineWidth = is3d ? (contour.ratio < 0.24 ? 2 : 1.1) : (contour.ratio < 0.16 ? 1.35 : 0.86);
      context.globalAlpha = alpha;
      tracePoints(contour.points);
      context.stroke();
    });

    context.globalAlpha = 1;

    drawSupportBasin(
      centerX,
      centerY,
      originalSupportLocal,
      shellRadius,
      config.links,
      palette,
      liveView
    );

    if (role === "recency" && displayedBlend > 0.3) {
      drawSubstituteBasin(
        centerX,
        centerY,
        substituteSupportLocal,
        shellRadius,
        clamp(displayedBlend * (0.88 + state.contrast * 0.18), 0, 1),
        palette,
        liveView
      );
    }

    const projectedCore = drawSupportFlows(
      centerX,
      centerY,
      originalSupportAnchors,
      coreLocal,
      config.links,
      rgba(palette.link, 0.8 + state.contrast * 0.14),
      liveView
    );
    const projectedResult = projectPoint(centerX, centerY, resultLocal, liveView);

    if (role === "recency" && displayedBlend > 0.3) {
      drawSubstituteFlows(
        centerX,
        centerY,
        substituteSupportAnchors,
        resultLocal,
        clamp(displayedBlend * (0.92 + state.contrast * 0.22), 0, 1),
        rgba(palette.break, 0.9),
        liveView
      );
    }

    drawCore(projectedCore, config.core, rgba(palette.link, 0.86 + state.contrast * 0.1), rgba(palette.core, 0.84 + state.contrast * 0.08));

    context.save();
    context.setLineDash(displayedBlend > 0.18 ? [6, 6] : []);
    context.strokeStyle = rgba(palette.break, 0.28 + displayedBlend * 0.42);
    context.lineWidth = 1.1;
    context.beginPath();
    context.moveTo(projectedCore.x, projectedCore.y);
    context.lineTo(projectedResult.x, projectedResult.y);
    context.stroke();
    context.restore();

    drawResultMarker(
      projectedResult,
      rgba(displayedBlend > 0.22 ? palette.break : palette.link, 0.92),
      rgba(displayedBlend > 0.22 ? palette.outer : palette.core, 0.32 + displayedBlend * 0.22),
      0.34 + displayedBlend * 0.56
    );

    const tagBounds = {
      left: centerX - sideWidth * 0.46,
      right: centerX + sideWidth * 0.46,
      top: canvas.clientWidth < 720 ? 74 : 88,
      bottom: canvas.clientHeight - 18,
    };
    const occupiedTags = [];
    const originalTagKey = `${role}-original`;
    const taskPlacement = chooseTaskTagPlacement(
      projectedCore.x,
      projectedCore.y,
      TASK_LABEL,
      role === "recency" ? ["top-left", "left", "bottom-left", "top", "top-right"] : ["top-right", "right", "bottom-right", "top", "top-left"],
      occupiedTags,
      tagBounds,
      state.tagPlacements[originalTagKey]
    );
    const animatedTaskPlacement = animateTaskPlacement(originalTagKey, taskPlacement);
    occupiedTags.push(animatedTaskPlacement);
    drawTaskTag(animatedTaskPlacement, rgba(palette.link, 0.9), "solid");

    if (role === "recency" && displayedBlend > 0.44) {
      const resultLabel = getResultLabel(displayedBlend);
      if (resultLabel) {
        const selectedTagKey = `${role}-selected`;
        const resultPlacement = chooseTaskTagPlacement(
          projectedResult.x,
          projectedResult.y,
          resultLabel,
          displayedBlend > 0.82 ? ["right", "bottom-right", "top-right", "bottom-left", "top-left"] : ["top-right", "right", "bottom-right", "bottom-left", "top-left"],
          occupiedTags,
          tagBounds,
          state.tagPlacements[selectedTagKey]
        );
        const animatedResultPlacement = animateTaskPlacement(selectedTagKey, resultPlacement);
        occupiedTags.push(animatedResultPlacement);
        drawTaskTag(animatedResultPlacement, rgba(palette.break, 0.92), "dashed");
      }
    }

    drawAxisGuide(centerX, centerY, shellRadius, liveView, displayedBlend, palette);

    context.restore();
  }

  function getPlateAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
      return null;
    }

    return isStackedLayout(rect.width) ? (y < rect.height / 2 ? "recency" : "guarded") : (x < rect.width / 2 ? "recency" : "guarded");
  }

  function startDrag(event) {
    if (state.viewMode !== "3d") {
      return;
    }

    const plate = getPlateAt(event.clientX, event.clientY);
    if (!plate) {
      return;
    }

    state.drag.activePlate = plate;
    state.drag.pointerId = event.pointerId;
    state.drag.lastX = event.clientX;
    state.drag.lastY = event.clientY;
    canvas.classList.add("is-dragging");
    canvas.setPointerCapture(event.pointerId);
  }

  function moveDrag(event) {
    if (state.drag.pointerId !== event.pointerId || !state.drag.activePlate) {
      return;
    }

    const dx = event.clientX - state.drag.lastX;
    const dy = event.clientY - state.drag.lastY;
    const view = state.plates[state.drag.activePlate];

    view.targetYaw = clamp(view.targetYaw + dx * 0.0066, -1.05, 1.05);
    view.targetPitch = clamp(view.targetPitch - dy * 0.0046, 0.74, 1.26);

    state.drag.lastX = event.clientX;
    state.drag.lastY = event.clientY;
  }

  function endDrag(event) {
    if (state.drag.pointerId !== event.pointerId) {
      return;
    }

    state.drag.activePlate = null;
    state.drag.pointerId = null;
    canvas.classList.remove("is-dragging");
  }

  function render() {
    state.time += 0.012;
    blendState();

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const stacked = isStackedLayout(width);

    context.clearRect(0, 0, width, height);
    drawBackground(width, height);
    stage.classList.toggle("is-stacked", stacked);

    const compact = width < 700;
    const leftCenterX = stacked ? width * 0.5 : width * (compact ? 0.285 : 0.26);
    const rightCenterX = stacked ? width * 0.5 : width * (compact ? 0.715 : 0.74);
    const recencyCenterY = stacked ? height * 0.3 : height * (compact ? 0.6 : 0.57);
    const guardedCenterY = stacked ? height * 0.74 : height * (compact ? 0.6 : 0.57);
    const sideWidth = stacked ? width * 0.8 : width * (compact ? 0.4 : 0.43);

    drawMap(
      leftCenterX,
      recencyCenterY,
      sideWidth,
      state.recency,
      {
        inner: [120, 77, 63],
        outer: [212, 108, 85],
        break: [181, 62, 43],
        link: [144, 76, 60],
        core: [188, 87, 74],
        shadow: [142, 97, 78],
      },
      state.plates.recency,
      "recency"
    );

    drawMap(
      rightCenterX,
      guardedCenterY,
      sideWidth,
      state.guarded,
      {
        inner: [40, 117, 144],
        outer: [35, 120, 154],
        break: [64, 123, 148],
        link: [31, 98, 120],
        core: [43, 116, 133],
        shadow: [77, 121, 141],
      },
      state.plates.guarded,
      "guarded"
    );

    context.save();
    context.strokeStyle = "rgba(20, 24, 31, 0.04)";
    context.lineWidth = 1;
    context.beginPath();
    if (stacked) {
      context.moveTo(width * 0.16, height / 2);
      context.lineTo(width * 0.84, height / 2);
    } else {
      context.moveTo(width / 2, height * 0.16);
      context.lineTo(width / 2, height * 0.84);
    }
    context.stroke();
    context.restore();

    requestAnimationFrame(render);
  }

  slider.addEventListener("input", () => {
    setCheckpoint(Number(slider.value));
  });

  reliefSlider.addEventListener("input", () => {
    state.targetRelief = Number(reliefSlider.value) / 100;
  });

  contrastSlider.addEventListener("input", () => {
    state.targetContrast = Number(contrastSlider.value) / 100;
  });

  stepButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setCheckpoint(Number(button.dataset.step));
    });
  });

  viewMode3dButton.addEventListener("click", () => {
    state.viewMode = "3d";
    syncViewModeUI();
  });

  viewMode2dButton.addEventListener("click", () => {
    state.viewMode = "2d";
    state.drag.activePlate = null;
    state.drag.pointerId = null;
    canvas.classList.remove("is-dragging");
    syncViewModeUI();
  });

  canvas.addEventListener("pointerdown", startDrag);
  canvas.addEventListener("pointermove", moveDrag);
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", (event) => {
    if (!canvas.hasPointerCapture(event.pointerId)) {
      endDrag(event);
    }
  });

  function showModal() {
    experimentModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function hideModal() {
    experimentModal.hidden = true;
    document.body.style.overflow = "";
  }

  openExperiment.addEventListener("click", showModal);
  closeExperiment.addEventListener("click", hideModal);
  experimentModal.addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-close-modal")) {
      hideModal();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !experimentModal.hidden) {
      hideModal();
    }
  });

  window.addEventListener("resize", resize);

  syncCheckpointUI();
  syncViewModeUI();
  resize();
  render();
})();
