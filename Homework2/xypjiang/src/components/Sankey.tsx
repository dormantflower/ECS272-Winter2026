import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

export default function SankeyChart() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const onResize = useDebounceCallback((size) => setSize(size), 200);
  useResizeObserver({ ref: containerRef as React.RefObject<HTMLDivElement>, onResize });

  useEffect(() => {
    if (size.width === 0 || size.height === 0) return;
    renderChart();
  }, [size]);

  const renderChart = async () => {

    const medallists = await d3.csv('/data/medallists.csv');
    const totals = await d3.csv('/data/medals_total.csv');

    // top 8 countries by total medals
    const top8 = totals.slice(0, 8).map(d => d.country_code);
    
    let nodes: any[] = [];
    let links: any[] = [];
    const nodeMap = new Map();

    const addNode = (name: string) => {
      if (!nodeMap.has(name)) {
        nodeMap.set(name, nodes.length);
        nodes.push({ name });
      }
      return nodeMap.get(name);
    };

    // top 8 countries medals in aquatic sports
    const sports = ['Swimming', 'Water Polo', 'Diving', 'Artistic Swimming', 'Marathon Swimming'];
    top8.forEach(code => {
      const countryMedals = medallists.filter(d => d.country_code === code);
      sports.forEach(sport => {
        const sportMedals = countryMedals.filter(m => m.discipline === sport);
        const realMedals = d3.group(sportMedals, d => `${d.event}-${d.medal_type}`);
        const count = realMedals.size;

        if (count > 0) {
          links.push({
            source: addNode(code),
            target: addNode(sport),
            value: count
          });

          const typeCounts = { 'Gold Medal': 0, 'Silver Medal': 0, 'Bronze Medal': 0 };
          
          for (let key of realMedals.keys()) {
            if (key.includes('Gold')) typeCounts['Gold Medal']++;
            else if (key.includes('Silver')) typeCounts['Silver Medal']++;
            else if (key.includes('Bronze')) typeCounts['Bronze Medal']++;
          }

          Object.entries(typeCounts).forEach(([type, tCount]) => {
            if (tCount > 0) {
              links.push({
                source: addNode(sport),
                target: addNode(type),
                value: tCount
              });
            }
          });
        }
      });

    });


    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // margins
    const margin = { top: 60, right: 60, bottom: 40, left: 60 };
    const innerWidth = size.width - margin.left - margin.right;
    const innerHeight = size.height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    //title
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", -margin.top / 2) 
      .attr("text-anchor", "middle")
      .style("font-size", "0.9rem")
      .style("font-weight", "normal")
      .style("fill", "#333")
      .text("Top 8 Countries Performance in Aquatic Sports");

    //generate sankey data
    const sankeyGen = sankey()
      .nodeWidth(20)
      .nodePadding(20)
      .extent([[0, 0], [innerWidth, innerHeight]]);

    const graph = sankeyGen({ nodes, links });

    // draw links
    g.append("g")
      .selectAll("path")
      .data(graph.links)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("fill", "none")
      .attr("stroke", (d: any) => {
          // colors
          const colors: any = { 'USA': '#0728fec8', 'CHN': '#EE1C25', 'AUS': '#008741', 'GBR': '#006aff' };
          const targetName = d.target.name;
          if (targetName === 'Gold Medal') return '#FFD700';
          if (targetName === 'Silver Medal') return '#C0C0C0';
          if (targetName === 'Bronze Medal') return '#CD7F32';

          return colors[d.source.name] || "#919191d9";
      })
      .attr("stroke-width", d => Math.max(1, d.width || 0))
      .attr("stroke-opacity", 0.4)
      .style("mix-blend-mode", "multiply");

    //draw nodes
    g.append("g")
      .selectAll("rect")
      .data(graph.nodes)
      .join("rect")
      .attr("x", d => d.x0 || 0)
      .attr("y", d => d.y0 || 0)
      .attr("height", d => (d.y1 || 0) - (d.y0 || 0))
      .attr("width", d => (d.x1 || 0) - (d.x0 || 0))
      .attr("fill", (d: any) => {
      const countryColors: any = { 
        'USA': '#0728fec8', 
        'CHN': '#EE1C25', 
        'AUS': '#008741', 
        'GBR': '#006aff' 
      };
      if (countryColors[d.name]) {
        return d3.color(countryColors[d.name])?.darker(0.8).toString() || countryColors[d.name];
      }
      if (d.name === 'Gold Medal') return '#E6B800';
      if (d.name === 'Silver Medal') return '#A9A9A9';
      if (d.name === 'Bronze Medal') return '#8B4513';
      return "#a7a7a7";
    })
      .attr("rx", 2);

    //text labels
    g.append("g")
      .selectAll("text")
      .data(graph.nodes)
      .join("text")
      .attr("x", d => (d.x0 || 0) < innerWidth / 2 ? (d.x1 || 0) + 6 : (d.x0 || 0) - 6)
      .attr("y", d => ((d.y1 || 0) + (d.y0 || 0)) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => (d.x0 || 0) < innerWidth / 2 ? "start" : "end")
      .text((d: any) => d.name)
      .style("font-size", "11px")
      .style("font-family", "sans-serif");
      };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </div>
  );
}