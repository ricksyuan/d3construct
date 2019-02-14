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


document.addEventListener('DOMContentLoaded', () => {
  
  d3.select('svg')
    .style('width', WIDTH)
    .style('height', HEIGHT);

  drawAxis(runs);
  render();
  
});

function render() {
  d3.select('#points').html('');
  d3.select('#points').selectAll('circle')
    .data(runs)
    .enter()
    .append('circle')
    .attr('cx', datum => xScale(datum.weight))
    .attr('cy', datum => yScale(datum.height));

  // Add point when svg is clicked.
  d3.select('svg').on('click', function () {
    const x = d3.event.offsetX;
    const y = d3.event.offsetY;
    const weight = xScale.invert(x);
    const height = yScale.invert(y);

    const newRun = {
      id: (runs.length > 0) ? runs[runs.length - 1].id + 1 : 1,
      weight: weight,
      height: height
    }
    runs.push(newRun);
    render();
    populateTable();
  });

  // Remove clicked point when clicked.
  d3.selectAll('circle').on('click', (datum, index) => {
    // Prevent event from hitting svg.
    d3.event.stopPropagation();
    runs = runs.filter(run => run.id !== datum.id);
    render();
    populateTable();
  });
};

function drawAxis() {

  const bottomAxis = d3.axisBottom(xScale);
  const leftAxis = d3.axisLeft(yScale);
  d3.select('svg')
    .append('g')
    .call(leftAxis)
    .append('g')
    .call(bottomAxis)
    .attr('transform', `translate(0, ${HEIGHT})`);

}

function populateTable() {
  const table = d3.select('tbody')
  table.html('');
  runs.forEach(run => {
    const row = table.append('tr');
    row.append('td').html(run.id);
    row.append('td').html(run.weight);
    row.append('td').html(run.height);
  });
}