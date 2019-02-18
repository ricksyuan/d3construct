import './styles/main.scss';
import * as d3 from 'd3';

const xFormatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const yFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

let dataset = [
  {
    id: 1,
    xVar: 30,
    yVar: 1500,
  },
  {
    id: 2,
    xVar: 60,
    yVar: 2000,
  },
  {
    id: 3,
    xVar: 90,
    yVar: 2500,
  },
];

const WIDTH = 800;
const HEIGHT = 300;
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Set x-scale and y-scale.
const xScale = d3.scaleLinear()
  .range([0, WIDTH])
  .domain([d3.min(dataset, datum => 0.9 * datum.xVar), d3.max(dataset, datum => 1.1 * datum.xVar)]);
const yScale = d3.scaleLinear()
  .domain([d3.min(dataset, datum => 0.9 * datum.yVar), d3.max(dataset, datum => 1.1 * datum.yVar)])
  .range([HEIGHT, 0]);

document.addEventListener('DOMContentLoaded', () => {
  // Set container svg dimensions.
  d3.select('.container')
    .style('width', WIDTH)
    .style('height', HEIGHT);

  // Set x and y axes.
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

    // Calculate means and stdDev.
    const meanX = d3.mean(dataset, datum => datum.xVar);
    const meanY = d3.mean(dataset, datum => datum.yVar);
    const stdX = d3.deviation(dataset, datum => datum.xVar);
    const stdY = d3.deviation(dataset, datum => datum.yVar);
    
    // Tie circles to dataset.
    const circles = d3.select('.points')
      .selectAll('circle')
      .data(dataset, datum => datum.id);
    circles.enter().append('circle');
    circles.exit().remove();

    d3.selectAll('circle')
      .attr('cx', datum => xScale(datum.xVar))
      .attr('cy', datum => yScale(datum.yVar))
      .attr('fill', datum => color(datum.id % 10));

    // Add line.

    d3.select('.points').append('line')
      .attr('x1', xScale(meanX))
      .attr('y1', -1000000)
      .attr('x2', xScale(meanX))
      .attr('y2', 1000000);

    d3.select('.points').append('line')
      .attr('x1', -1000000)
      .attr('y1', yScale(meanY))
      .attr('x2', 1000000)
      .attr('y2', yScale(meanY));

    // Render table
    const tableHeader = d3.select('thead');
    tableHeader.html('');
    let row;
    row = tableHeader.append('tr');
    row.append('td').html('id');
    row.append('td').html('Temperature (F°)');
    row.append('td').html('Ice Cream Sales');

    const tableBody = d3.select('tbody');
    // Clear table body.

    // Append means.
    tableBody.html('');
    row = tableBody.append('tr');
    row.append('td').html('mean');
    row.append('td').html(xFormatter.format(meanX));
    row.append('td').html(yFormatter.format(meanY));

    // Append standard deviations.
    row = tableBody.append('tr');
    row.append('td').html('st dev');
    row.append('td').html(xFormatter.format(stdX));
    row.append('td').html(yFormatter.format(stdY));

    // Append runs.
    dataset.forEach((run) => {
      row = tableBody.append('tr');
      row.append('td').html(run.id);
      row.append('td').html(xFormatter.format(run.xVar));
      row.append('td').html(yFormatter.format(run.yVar));
    });

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
    d3.selectAll('circle').on('click', (clickedDatum) => {
      d3.selectAll('line').remove();

      // Prevent event from hitting svg.
      d3.event.stopPropagation();
      // Filter data to not include clicked point
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
      renderAll();
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

  renderAll();
});
