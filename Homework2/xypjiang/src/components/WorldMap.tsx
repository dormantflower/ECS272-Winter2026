import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { isEmpty } from 'lodash';

// data type
interface MedalRow {
  country_code: string;
  total: number;
}

export default function WorldMap() {
  const [data, setData] = useState<MedalRow[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onResize = useDebounceCallback((size) => setSize(size), 200);

  useResizeObserver({ ref: mapRef as React.RefObject<HTMLDivElement>, onResize });

  useEffect(() => {
    // load medal data
    const loadData = async () => {
      const csvData = await d3.csv('../../data/medals_total.csv', d => ({
        country_code: d.country_code,
        total: +d['Total']!
      }));
      setData(csvData as any);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isEmpty(data) || size.width === 0 || size.height === 0) return;
    d3.select('#map-svg').selectAll('*').remove();
    initMap();
  }, [data, size]);

  async function initMap() {
    const svg = d3.select('#map-svg');
    
    // Load map
    const worldData: any = await d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson");

    // Define projection
    const projection = d3.geoNaturalEarth1()
      .scale(size.width / 5.5)
      .translate([size.width / 2, size.height / 2]);

    const path = d3.geoPath().projection(projection);

    // Color Scale
    const colorScale = d3.scaleThreshold<number, string>()
      .domain([1, 20, 50, 100, 150])
      .range(d3.schemeBlues[5]);

    // Draw the map
    svg.append("g")
      .selectAll("path")
      .data(worldData.features)
      .join("path")
      .attr("d", path as any)
      .attr("fill", (d: any) => {
        const country = data.find(m => m.country_code === d.id);
        return country ? colorScale(country.total) : "#dfdfdf";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5);
      
    // title for map
    svg.append('text')
      .attr('x', size.width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style("font-size", "0.9rem")
      .style('font-weight', 'normal')
      .text('Paris 2024 Medal Distribution');

    // legend
    const legendX = 40;
    const legendY = size.height - 150;
    const legend = svg.append("g")
      .attr("transform", `translate(${legendX}, ${legendY})`);

    const thresholds = [0, 1, 20, 50, 100, 150];
    const boxSize = 18;

    const legendData = thresholds.map((t, i) => {
      let label = "";
      if (i === 0) label = "0";
      else if (i === thresholds.length - 1) label = `${t}+`;
      else label = `${t}-${thresholds[i+1] - 1}`;
      return {
        color: i === 0 ? "#dfdfdf" : colorScale(t),
        label: label
      };
    });

    // color boxes
    legend.selectAll("rect")
      .data(legendData)
      .join("rect")
      .attr("y", (d, i) => i * (boxSize + 5))
      .attr("width", boxSize)
      .attr("height", boxSize)
      .attr("fill", d => d.color)
      .attr("stroke", "#ccc")
      .attr("stroke-width", 0.5);

    // text labels
    legend.selectAll("text")
      .data(legendData)
      .join("text")
      .attr("x", boxSize + 10)
      .attr("y", (d, i) => i * (boxSize + 5) + boxSize / 2)
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .style("fill", "#666")
      .text(d => d.label);

    // title for legend
    legend.append("text")
      .attr("y", -10)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text("Total Medals");
  }

  return (
    <div ref={mapRef} style={{ width: '100%', height: '100%' }}>
      <svg id='map-svg' width='100%' height='100%'></svg>
    </div>
  );
}