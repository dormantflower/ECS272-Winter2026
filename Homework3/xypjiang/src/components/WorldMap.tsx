import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { isEmpty, set } from 'lodash';

// data type
interface MedalRow {
  country_code: string;
  total: number;
  country: string;
}

interface WorldMapProps {
  selectedCountry: string | null;
  onCountrySelect: (country: string | null) => void;
}

export default function WorldMap({ selectedCountry, onCountrySelect }: WorldMapProps) {
  const [data, setData] = useState<MedalRow[]>([]);
  const [clickableCountries, setClickableCountries] = useState<Set<string>>(new Set());
  const mapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onResize = useDebounceCallback((size) => setSize(size), 200);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const AQUATIC_DISCIPLINES = ['Swimming', 'Diving', 'Water Polo', 'Artistic Swimming', 'Marathon Swimming'];


  useResizeObserver({ ref: mapRef as React.RefObject<HTMLDivElement>, onResize });

  useEffect(() => {
    // load medal data
    const loadData = async () => {
      const [csvData, medalists] = await Promise.all([
        d3.csv('../../data/medals_total.csv', d => ({
          country_code: d.country_code,
          total: +d['Total']!,
          country: d.country 
        })),
        d3.csv('../../data/medallists.csv')
      ]);

      const clickableCountries = new Set(
        medalists
          .filter(d => AQUATIC_DISCIPLINES.includes(d.discipline))
          .map(d => d.country_code)
      );
      setData(csvData as any);
      setClickableCountries(clickableCountries);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isEmpty(data) || size.width === 0 || size.height === 0) return;
    d3.select('#map-svg').selectAll('*').remove();
    initMap();
  }, [data, size, selectedCountry]);

  async function initMap() {
    const svg = d3.select('#map-svg');
    const tooltip = d3.select(tooltipRef.current);
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
        // highlight selected country in pink
        if (d.id === selectedCountry) return '#de7fb3';
        return country ? colorScale(country.total) : "#dfdfdf";
      })
      .attr("stroke", (d: any) => d.id === selectedCountry ? "#ed3098" : "#fff")
      .attr("stroke-width", 0.5)
      .style("cursor", (d:any)=>{
        const country = data.find(m =>m.country_code === d.id);
        return clickableCountries.has(d.id) ? "pointer" : "default";
      })
      .on("click", (event: any, d: any) => {
        // only allow selection if the country has medal
        // const country = data.find(m => m.country_code === d.id);
        if (!clickableCountries.has(d.id)) return;
        // toggle selection
        if (selectedCountry === d.id) {
          onCountrySelect(null);
        } else {
          onCountrySelect(d.id);
        }
      })
      .on("mouseover", function(this: any, event: any, d: any) {
        const ctry = data.find(m=>m.country_code === d.id);
        if (!clickableCountries.has(d.id)) return;

        d3.select(this)
          .style("opacity", 0.8)
          .style("cursor", "pointer");

        tooltip
          .style("opacity", 1)
          .style("visibility", "visible")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px")
          .html(`
              <strong>${ctry?.country}</strong><br/>
              Total Medals: ${ctry?.total}
            
          `);
      })
      .on("mousemove", function(this: any, event: any) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function(this: any) {
        d3.select(this).style("opacity", 1);
        tooltip.style("opacity", 0).style("visibility", "hidden");
      });
      
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
      {/* Tooltip */}
      <div
        ref = {tooltipRef}
        style = {{
          position: 'fixed',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          padding: '5px 10px',
          borderRadius: '4px',
          pointerEvents: 'none',
          fontSize: '12px',
          opacity: 0,
          visibility: 'hidden',
          transition: 'opacity 0.5s ease-in-out',

        }}
      
      
      />
    </div>
  );
}