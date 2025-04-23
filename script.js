// 引入 TensorFlow.js 和 PoseNet
const script1 = document.createElement("script");
script1.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs";
document.head.appendChild(script1);

const script2 = document.createElement("script");
script2.src = "https://cdn.jsdelivr.net/npm/@tensorflow-models/posenet";
document.head.appendChild(script2);

script2.onload = () => {
  startPoseNet();
};

async function startPoseNet() {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  // 打开摄像头
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  const net = await posenet.load();

  video.onloadedmetadata = () => {
    detectPose();
  };

  async function detectPose() {
    const pose = await net.estimateSinglePose(video, {
      flipHorizontal: false
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawKeypoints(pose.keypoints, 0.5, ctx);

    const nose = pose.keypoints.find(p => p.part === "nose");
    const leftWrist = pose.keypoints.find(p => p.part === "leftWrist");
    const rightWrist = pose.keypoints.find(p => p.part === "rightWrist");

    if (leftWrist && rightWrist && nose) {
      const isHandsUp = leftWrist.position.y < nose.position.y &&
                        rightWrist.position.y < nose.position.y;
      console.log(isHandsUp ? "🖐 举手！" : "🙌 手放下");
    }

    requestAnimationFrame(detectPose);
  }
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

let ballY = 200; // 小球初始位置
let velocity = 0;
let gravity = 0.3;
let lift = -6;

function drawBall(ctx, y) {
  ctx.beginPath();
  ctx.arc(100, y, 20, 0, 2 * Math.PI);
  ctx.fillStyle = "orange";
  ctx.fill();
}

// 修改 detectPose() 函数，加入控制小球逻辑：
async function detectPose() {
  const pose = await net.estimateSinglePose(video, { flipHorizontal: false });

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawKeypoints(pose.keypoints, 0.5, ctx);

  const nose = pose.keypoints.find(p => p.part === "nose");
  const leftWrist = pose.keypoints.find(p => p.part === "leftWrist");
  const rightWrist = pose.keypoints.find(p => p.part === "rightWrist");

  let isHandsUp = false;

  if (leftWrist && rightWrist && nose) {
    isHandsUp = leftWrist.position.y < nose.position.y &&
                rightWrist.position.y < nose.position.y;
  }

  // 控制逻辑
  if (isHandsUp) {
    velocity += lift;
  }
  velocity += gravity;
  ballY += velocity;

  // 防止小球出界
  if (ballY > canvas.height - 20) {
    ballY = canvas.height - 20;
    velocity = 0;
  }
  if (ballY < 20) {
    ballY = 20;
    velocity = 0;
  }

  drawBall(ctx, ballY);
  console.log("正在画小球，位置：", ballY);
  requestAnimationFrame(detectPose);
}