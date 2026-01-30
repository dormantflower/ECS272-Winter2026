import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

export default function ScatterPlot() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const onResize = useDebounceCallback((size) => setSize(size), 200);
  useResizeObserver({ ref: containerRef as React.RefObject<HTMLDivElement>, onResize });

  useEffect(() => {
    if (size.width === 0 || size.height === 0) return;
    renderScatter();
  }, [size]);

  const renderScatter = async () => {
    const data = await d3.csv('/data/medallists.csv');

    // filter athletes
    const targetCountry = ['GBR', 'USA', 'CHN', 'AUS','JPN', 'FRA', 'NED', 'KOR']; 
    const targetSports = ['Swimming'];
    const filteredData = data.filter(d => 
      targetCountry.includes(d.country_code) && 
      targetSports.includes(d.discipline)
    );
    
    const scoreMap: Record<string, number> = {
        'Gold Medal': 3,
        'Silver Medal': 2,
        'Bronze Medal': 1
    };

    //cluster by athlete and calculate total score
    const athleteMap = d3.rollup(filteredData, 
      v => {
          const totalScore = d3.sum(v, (d: any) => scoreMap[d.medal_type] || 0);
          const birthYear = new Date(v[0].birth_date).getFullYear();
          const age = 2024 - birthYear;
          return { 
            name: v[0].name, 
            score: totalScore, 
            age: age, 
            discipline: v[0].discipline,
            gender: v[0].gender
          };
      },
      d => d.name
    );

    // charge Map to Array and filter out invalid ages
    const plotData = Array.from(athleteMap.values()).filter(d => !isNaN(d.age));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 50, right: 30, bottom: 50, left: 50 };
    const innerWidth = size.width - margin.left - margin.right;
    const innerHeight = size.height - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // define scales
    const xScale = d3.scaleLinear()
      .domain([d3.min(plotData, d => d.age)! - 2, d3.max(plotData, d => d.age)! + 2])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(plotData, d => d.score)! + 1])
      .range([innerHeight, 0]);

    // define project color scale
    const genderColorScale = d3.scaleOrdinal()
      .domain(['Male', 'Female'])
      .range(['#1292ed', '#ad41e7']);

    // draw axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => `${d}y`));

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5));

    // draw points
    g.selectAll("circle")
      .data(plotData)
      .join("circle")
      // use jitter to avoid overplotting
      .attr("cx", d => xScale(d.age) + (Math.random() - 0.5) * 15) 
      .attr("cy", d => yScale(d.score) + (Math.random() - 0.5) * 15)
      .attr("r", 5)
      .attr("fill", (d: any) => genderColorScale(d.gender) as string) 
      .attr("opacity", 0.7)
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .append("title") // display tooltip on hover
      .text(d => `${d.name}\nScore: ${d.score}\nAge: ${d.age}\nGender: ${d.gender}`);

    // title and labels
    svg.append("text")
      .attr("x", size.width / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .style("font-size", "0.9rem")
      .style("font-weight", "normal")
      .text("Top 8 Countries Age-Performance Correlation in Aquatics");

    // Y axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -35)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Score (Gold=3, Silver=2, Bronze=1)");

    // X axis label
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Age");
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </div>
  );
}