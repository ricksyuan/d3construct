import './styles/main.scss';
import * as d3 from 'd3';

const betaFormatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const xFormatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const yFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Seed data
let dataset = [
  {
    id: 1,
    xVar: 30,
    yVar: 1500,
  },
  {
    id: 2,
    xVar: 60,
    yVar: 2200,
  },
  {
    id: 3,
    xVar: 90,
    yVar: 2500,
  },
];

const MARGIN = {
  TOP: 20,
  RIGHT: 20,
  BOTTOM: 50,
  LEFT: 70, // Allows comfortable space for y-axis labels
};
const WIDTH = 800 - MARGIN.LEFT - MARGIN.RIGHT;
const HEIGHT = 300 - MARGIN.TOP - MARGIN.BOTTOM;
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Set x-scale and y-scale.
const xScale = d3.scaleLinear()
  .domain([d3.min(dataset, datum => 0.9 * datum.xVar), d3.max(dataset, datum => 1.1 * datum.xVar)])
  .range([0, WIDTH]);
const yScale = d3.scaleLinear()
  .domain([d3.min(dataset, datum => 0.9 * datum.yVar), d3.max(dataset, datum => 1.1 * datum.yVar)])
  .range([HEIGHT, 0]);

document.addEventListener('DOMContentLoaded', () => {
  // Set dimensions for container svg element.
  const container = d3.select('.container')
    .style('width', WIDTH)
    .style('height', HEIGHT)
    .attr('transform', `translate(${MARGIN.LEFT},${MARGIN.TOP})`);

  container.append('svg') // Append another svg for clipping.
    .append('g')
    .attr('class', 'points');

  // Add x and y axes.
  const bottomAxis = d3.axisBottom(xScale);
  d3.select('.container')
    .append('g')
    .attr('class', 'x-axis')
    .call(bottomAxis)
    .attr('transform', `translate(0, ${HEIGHT})`);
  const leftAxis = d3.axisLeft(yScale);
  d3.select('.container')
    .append('g')
    .attr('class', 'y-axis')
    .call(leftAxis);

  // Add labels for x and y axes.
  d3.select('.container')
    .append('text')
    .attr('class', 'x-axis-label')
    .attr('transform', `translate(${WIDTH / 2},${HEIGHT + 40})`)
    .style('text-anchor', 'middle')
    .text('Temperature (F°)');

  d3.select('.container')
    .append('text')
    .attr('class', 'y-axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - MARGIN.LEFT)
    .attr('x', 0 - (HEIGHT / 2))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .text('Ice Cream Sales ($)');

  // Define the div for the tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  // Add zoom and pan capabilities.
  let lastTransform = null;

  function zoomCallback() {
    lastTransform = d3.event.transform;
    d3.select('.points').attr('transform', d3.event.transform);
    d3.select('.x-axis')
      .call(bottomAxis.scale(d3.event.transform.rescaleX(xScale)));
    d3.select('.y-axis')
      .call(leftAxis.scale(d3.event.transform.rescaleY(yScale)));
  }

  const zoom = d3.zoom()
    .on('zoom', zoomCallback);
  d3.select('.container').call(zoom);

  function renderAll() {
    // Calculate means.
    const meanX = d3.mean(dataset, datum => datum.xVar);
    const meanY = d3.mean(dataset, datum => datum.yVar);

    // Calculate slope.
    const b1Numerator = dataset
      .map(datum => (datum.xVar - meanX) * (datum.yVar - meanY))
      .reduce((acc, datum) => acc + datum);
    const b1Denominator = dataset
      .map(datum => (datum.xVar - meanX) ** 2)
      .reduce((acc, datum) => acc + datum);
    const b1 = b1Numerator / b1Denominator;

    // Calculate intercept.
    const b0 = meanY - b1 * meanX;

    function f(x) {
      return b0 + b1 * x;
    }

    // Tie circles to dataset.
    const points = d3.select('.points')
      .selectAll('.pt')
      .data(dataset, datum => datum.id)
      .enter()
      .append('g')
      .attr('class', 'pt');
    points.append('circle')
      .attr('cx', datum => xScale(datum.xVar))
      .attr('cy', datum => yScale(datum.yVar))
      .attr('fill', datum => color(datum.id % 10))
      .on('mouseover', (datum) => {
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        tooltip.html(`${xFormatter.format(datum.xVar)}°F <br/> ${yFormatter.format(datum.yVar)}`)
          .style('left', `${d3.event.pageX + 12}px`)
          .style('top', `${d3.event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });          
    points.exit().remove();

    // Add line.
    d3.select('.points').append('line')
      .attr('class', 'line-of-best-fit')
      .attr('x1', xScale(-10000))
      .attr('y1', yScale(f(-10000)))
      .attr('x2', xScale(10000))
      .attr('y2', yScale(f(10000)));

    // add residuals
    d3.selectAll('.pt').append('line')      
      .attr('x1', datum => xScale(datum.xVar))
      .attr('y1', datum => yScale(f(datum.xVar)))
      .attr('x2', datum => xScale(datum.xVar))
      .attr('y2', datum => yScale(datum.yVar))      

    // Render equation

    const equation = d3.select('.equation');
    equation.html(`<i>y</i> = ${betaFormatter.format(b0)} ${b1 >= 0 ? '+' : '-'} ${betaFormatter.format(Math.abs(b1))} <i>x</i>`);

    // Add listener to add point when svg is clicked.
    d3.select('.container').on('click', () => {
      d3.selectAll('line').remove();
      let x = d3.event.offsetX;
      let y = d3.event.offsetY;
      if (lastTransform !== null) {
        x = lastTransform.invertX(d3.event.offsetX);
        y = lastTransform.invertY(d3.event.offsetY);
      }
      const xVar = xScale.invert(x);
      const yVar = yScale.invert(y);
      const newDatum = {
        id: (dataset.length > 0) ? dataset[dataset.length - 1].id + 1 : 1,
        xVar,
        yVar,
      };
      dataset.push(newDatum);
      renderAll();
    });

    // Add listener to remove point when clicked.
    d3.selectAll('.pt').on('click', (clickedDatum) => {
      d3.selectAll('.pt').remove();
      d3.selectAll('.line-of-best-fit').remove();

      // Fade tooltip
      tooltip.transition()
        .duration(500)
        .style('opacity', 0);
      // Prevent event from hitting svg.
      d3.event.stopPropagation();
      // Filter data to not include clicked point.
      dataset = dataset.filter(datum => datum.id !== clickedDatum.id);
      renderAll();
    });

    function dragEnd(datum) {
      d3.selectAll('line').remove();
      const { x, y } = d3.event;
      const xVar = xScale.invert(x);
      const yVar = yScale.invert(y);
      datum.xVar = xVar;
      datum.yVar = yVar;
      tooltip.transition()
        .duration(500)
        .style('opacity', 0);
      renderAll();
    }

    // Drag cannot be fat arrow function.
    function drag() {
      const { x, y } = d3.event;
      d3.select(this).attr('cx', x);
      d3.select(this).attr('cy', y);
      tooltip.html(`${xFormatter.format(xScale.invert(x))}°F <br/> ${yFormatter.format(yScale.invert(y))}`)
        .style('left', `${d3.event.pageX + 12}px`)
        .style('top', `${d3.event.pageY - 28}px`)
        .style('opacity', 0.9);
    }

    const dragBehavior = d3.drag()
      .on('drag', drag)
      .on('end', dragEnd);
    d3.selectAll('circle').call(dragBehavior);
  }

  renderAll();
});
