window.onload = () => {
  const script1 = document.createElement("script");
  script1.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.21.0"; // ✅ 正确写法
  document.head.appendChild(script1);

  const script2 = document.createElement("script");
  script2.src = "https://cdn.jsdelivr.net/npm/@tensorflow-models/posenet";
  document.head.appendChild(script2);

  script2.onload = () => {
    startPoseNet();
  };

  let ballY = 200;
  let velocity = 0;
  const gravity = 0.3;
  const lift = -6;

  async function startPoseNet() {
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.play();

    const net = await posenet.load();
    console.log("✅ PoseNet 模型加载完成");

    video.onloadedmetadata = () => {
      detectPose();
    };

    async function detectPose() {
      const pose = await net.estimateSinglePose(video, { flipHorizontal: false });
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawKeypoints(pose.keypoints, 0.5, ctx);

      const nose = pose.keypoints.find(p => p.part === "nose");
      const leftWrist = pose.keypoints.find(p => p.part === "leftWrist");
      const rightWrist = pose.keypoints.find(p => p.part === "rightWrist");

      let isHandsUp = false;
      if (nose && leftWrist && rightWrist) {
        isHandsUp = leftWrist.position.y < nose.position.y &&
                    rightWrist.position.y < nose.position.y;
      }

      if (isHandsUp) velocity += lift;
      velocity += gravity;
      ballY += velocity;

      if (ballY > canvas.height - 20) {
        ballY = canvas.height - 20;
        velocity = 0;
      }
      if (ballY < 20) {
        ballY = 20;
        velocity = 0;
      }

      drawBall(ctx, ballY);
      requestAnimationFrame(detectPose);
    }

    function drawKeypoints(keypoints, minConfidence, ctx) {
      keypoints.forEach(kp => {
        if (kp.score >= minConfidence) {
          const { y, x } = kp.position;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = "aqua";
          ctx.fill();
        }
      });
    }

    function drawBall(ctx, y) {
      ctx.beginPath();
      ctx.arc(100, y, 20, 0, 2 * Math.PI);
      ctx.fillStyle = "orange";
      ctx.fill();
    }
  }
};
