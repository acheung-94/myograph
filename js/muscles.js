d3.csv("data/muscles.csv").then(
    data => {

    const nodesMap = new Map();
    const links = [];
  
    data.forEach(row => {
        const muscle = row.muscle.trim();
        const origin = row.origin.trim();
        const insertion = row.insertion.trim();
      
        // Add muscle node
        if (!nodesMap.has(muscle)) {
          nodesMap.set(muscle, { id: muscle, type: "muscle", count: 0 });
        }
      
        // Add origin node and link
        if (!nodesMap.has(origin)) {
          nodesMap.set(origin, { id: origin, type: "attachment", count: 0 });
        }
        // Fix here: origin → muscle for origin links
        links.push({ source: origin, target: muscle, direction: "origin" });
        nodesMap.get(origin).count++;
      
        // Add insertion node and link
        if (!nodesMap.has(insertion)) {
          nodesMap.set(insertion, { id: insertion, type: "attachment", count: 0 });
        }
        // insertion link stays muscle → insertion
        links.push({ source: muscle, target: insertion, direction: "insertion" });
        nodesMap.get(insertion).count++;
      });
  
    const nodes = Array.from(nodesMap.values());
    renderGraph(nodes, links);
  });

  function renderGraph(nodes, links) {
    const width = window.innerWidth;
    const height = window.innerHeight;
  
    const svg = d3.select("#viz")
      .append("svg")
      .attr("width", width)
      .attr("height", height);
  
    const defs = svg.append("defs");
  
    // Pink arrow for origin → muscle
    defs.append("marker")
      .attr("id", "arrow-origin")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)     // tip position
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0,-5 L 10,0 L 0,5")
      .attr("fill", "pink");
  
    // Blue arrow for muscle → insertion
    defs.append("marker")
      .attr("id", "arrow-insertion")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0,-5 L 10,0 L 0,5")
      .attr("fill", "#4A90E2");
  
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(d => {
        // Provide padding for the rect around the text (approximate)
        // You can tweak the 8 to adjust spacing
        return 8 + (d.count * 4) + 10;
      }));
  
    // Draw links with color and arrow based on direction
    const link = svg.append("g")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke-width", 2)
      .attr("stroke", d => d.direction === "origin" ? "pink" : "#4A90E2")
      .attr("marker-end", d =>
        d.direction === "origin" ? "url(#arrow-origin)" : "url(#arrow-insertion)"
      );
  
    // Node groups: rect + text
    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
  
    // Append text labels
    const labels = node.append("text")
    .text(d => d.id)
    .attr("font-size", 14)
    .style("fill", d => d.type === "muscle" ? "#1a237e" : "#b71c1c")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("stroke", "black")
    .attr("stroke-width", 0.3);
  
    // Append rects sized to text bbox + padding
    node.insert("rect", "text")
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("fill", d => d.type === "muscle" ? "#D6E4FF" : "#F8C6D3")
      .attr("stroke", d => d.type === "muscle" ? "#4A90E2" : "#E94E77")
      .attr("stroke-width", 1.5);
  
    // After DOM elements created, size rect to text size
    // Need to wait for labels to render first:
    labels.each(function(d) {
      const bbox = this.getBBox();
      d.bbox = bbox;
    });
  
    node.selectAll("rect")
      .attr("width", d => d.bbox.width + 16)  // 8px padding left+right
      .attr("height", d => d.bbox.height + 10) // 5px padding top+bottom
      .attr("x", d => - (d.bbox.width / 2) - 8)
      .attr("y", d => - (d.bbox.height / 2) - 5);
  
    simulation.on("tick", () => {
      // Position links
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
  
      // Position node groups
      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });
  
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
  
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
  
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }