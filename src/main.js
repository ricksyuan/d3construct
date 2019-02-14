import './styles/main.scss';
import * as d3 from 'd3';

const WIDTH = 800;
const HEIGHT = 300;
let runs = [
  {
    id: 1,
    weight: 140,
    height: 70,
  },
  {
    id: 2,
    weight: 150,
    height: 72,
  },
  {
    id: 3,
    weight: 160,
    height: 74,
  },
];

const xDomain = d3.extent(runs, datum => datum.weight);
const xScale = d3.scaleLinear()
  .range([0, WIDTH])
  .domain(xDomain);
const yDomain = d3.extent(runs, datum => datum.height);
const yScale = d3.scaleLinear()
  .domain(yDomain)
  .range([HEIGHT, 0]);

function populateTable() {
  const table = d3.select('tbody');
  table.html('');
  runs.forEach((run) => {
    const row = table.append('tr');
    row.append('td').html(run.id);
    row.append('td').html(run.weight);
    row.append('td').html(run.height);
  });
}

function render() {
  d3.select('#points').html('');
  d3.select('#points').selectAll('circle')
    .data(runs)
    .enter()
    .append('circle')
    .attr('cx', datum => xScale(datum.weight))
    .attr('cy', datum => yScale(datum.height));

  populateTable();

  function dragEnd(datum) {
    const { x, y } = d3.event;
    const weight = xScale.invert(x);
    const height = yScale.invert(y);
    datum.weight = weight;
    datum.height = height;
    populateTable();
  }

  // Drag cannot be fat arrow function.
  function drag() {
    const { x, y } = d3.event;
    d3.select(this).attr('cx', x);
    d3.select(this).attr('cy', y);
  }
  const dragBehavior = d3.drag()
    .on('drag', drag)
    .on('end', dragEnd);
  d3.selectAll('circle').call(dragBehavior);
}

document.addEventListener('DOMContentLoaded', () => {
  d3.select('#container')
    .style('width', WIDTH)
    .style('height', HEIGHT);

  const bottomAxis = d3.axisBottom(xScale);
  d3.select('#container')
    .append('g')
    .attr('id', 'x-axis')
    .call(bottomAxis)
    .attr('transform', `translate(0, ${HEIGHT})`);
  const leftAxis = d3.axisLeft(yScale);
  d3.select('#container')
    .append('g')
    .attr('id', 'y-axis')
    .call(leftAxis);

  // Add zoom.
  let lastTransform = null;
  function zoomCallback() {
    lastTransform = d3.event.transform;
    d3.select('#points').attr('transform', d3.event.transform);
    d3.select('#x-axis')
      .call(bottomAxis.scale(d3.event.transform.rescaleX(xScale)));
    d3.select('#y-axis')
      .call(leftAxis.scale(d3.event.transform.rescaleY(yScale)));
  }

  const zoom = d3.zoom()
    .on('zoom', zoomCallback);
  d3.select('#container').call(zoom);

  // Add point when svg is clicked.
  d3.select('#container').on('click', () => {
    let x = d3.event.offsetX;
    let y = d3.event.offsetY;
    if (lastTransform !== null) {
      x = lastTransform.invertX(d3.event.offsetX);
      y = lastTransform.invertY(d3.event.offsetY);
    }
    const weight = xScale.invert(x);
    const height = yScale.invert(y);

    const newRun = {
      id: (runs.length > 0) ? runs[runs.length - 1].id + 1 : 1,
      weight,
      height,
    };
    runs.push(newRun);
    render();
  });

  // Remove clicked point when clicked.
  d3.selectAll('circle').on('click', (datum) => {
    // Prevent event from hitting svg.
    d3.event.stopPropagation();
    runs = runs.filter(run => run.id !== datum.id);
    render();
  });
  // Draw points and table.
  render();
});
