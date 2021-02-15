import React, { useEffect } from "react";
import PropTypes from "prop-types";

const useCanvas = (draw, color, xData, yData, options = {}) => {
  const canvasRef = React.useRef(null);

  useEffect(
    () => {
      const canvas = canvasRef.current;
      const context = canvas.getContext(options.context || "2d");
      let animationFrameId;
      const render = () => {
        draw(context, xData, yData, color);
        animationFrameId = window.requestAnimationFrame(render);
      };
      render();
      return () => {
        window.cancelAnimationFrame(animationFrameId);
      };
    },
    [options.context, xData, yData, color, draw]
  );
  return canvasRef;
};

function drawFunc(ctx, xData, yData, color) {
  const xSum = xData.reduce((a, b) => a + b, 0);
  const xRatio = ctx.canvas.width / xSum;

  const yMax = Math.max.apply(Math, yData);
  const yRatio = ctx.canvas.height / yMax;

  xData = xData.map(x => x * xRatio);
  yData = yData.map(y => y * yRatio);

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  let x0 = 0;
  for (let i = 0; i < xData.length; i++) {
    const x1 = x0 + xData[i];
    const y0 = ctx.canvas.height - yData[i];
    const y1 = ctx.canvas.height - (i === 0 ? yData[i] : i === yData.length - 1 ? yData[i] : yData[i + 1]);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1, ctx.canvas.height);
    ctx.lineTo(x0, ctx.canvas.height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    x0 = x1;
  }
}

export const DataGraph = props => {
  const { options, data, color, xAxis, yAxis, ...rest } = props;
  const { context } = options;

  const xData = data.map(d => d[xAxis]);
  const yData = data.map(d => d[yAxis]);
  const canvasRef = useCanvas(drawFunc, color, xData, yData, { context });

  return <canvas ref={canvasRef} {...rest} />;
};

DataGraph.propTypes = {
  options: PropTypes.object,
  data: PropTypes.array,
  xAxis: PropTypes.string,
  yAxis: PropTypes.string,
  color: PropTypes.string
};
