import './styles/main.scss';
import * as d3 from 'd3';

document.addEventListener('DOMContentLoaded', () => {
  const WIDTH = 800;
  const HEIGHT = 300;

  const runs = [
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

  d3.select('svg')
    .style('width', WIDTH)
    .style('height', HEIGHT);

  const xDomain = d3.extent(runs, datum => datum.weight);
  const xScale = d3.scaleLinear()
    .range([0, WIDTH])
    .domain(xDomain);
  const yDomain = d3.extent(runs, datum => datum.height);
  const yScale = d3.scaleLinear()
    .domain(yDomain)
    .range([HEIGHT, 0]);

  d3.select('svg').selectAll('circle')
    .data(runs)
    .enter()
    .append('circle')
    .attr('cx', datum => xScale(datum.weight))
    .attr('cy', datum => yScale(datum.height));

  const bottomAxis = d3.axisBottom(xScale);
  const leftAxis = d3.axisLeft(yScale);
  d3.select('svg')
    .append('g')
    .call(leftAxis)
    .append('g')
    .call(bottomAxis)
    .attr('transform', `translate(0, ${HEIGHT})`);

  runs.forEach(run => (
    d3.select('tbody').append('tr')
      .append('td')
      .html(run.id)
      .append('td')
      .html(run.weight)
      .append('td')
      .html(run.height)
  ));
});