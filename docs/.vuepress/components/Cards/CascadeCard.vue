<script>
import D3Card from "./D3Card.vue";
import * as d3 from "d3";


export default {
  name: "CascadeCard",
  extends: D3Card,
  props: {
    margin: {
      type: Object,
      default: () => {
        return { top: 10, right: 30, bottom: 80, left: 80 };
      }
    },
    chartData: {
      type: Array,
      default: function() {
        return [
          { "Index": "Gap1_Prog", "M": 0.9329198173346482, "L": 0.9116261562562565, "U": 0.9562840932019625 },
          { "Index": "Gap2_Prog", "M": 0.8277473631766259, "L": 0.7890179858657949, "U": 0.868097986197335 },
          { "Index": "Gap3_Prog", "M": 0.8115206414788715, "L": 0.7703857631661177, "U": 0.8546816935981275 },
          { "Index": "Gap4_Prog", "M": 0.7422743230298513, "L": 0.690788955330807, "U": 0.7965914182869811 },
          { "Index": "Gap5_Prog", "M": 0.641617072066696, "L": 0.5971134568230774, "U": 0.6885684140985635 }
        ]
      }
    },
    ylab: {
      type: String,
      default: "Number"
    },
    xlabels: {
      Gap1_Prog: "Sym. onset",
      Gap2_Prog: "Awareness",
      Gap3_Prog: "Care-seeking",
      Gap4_Prog: "Diagnosed",
      Gap5_Prog: "Tx ini"
    },
    drawChart: {
      type: Function,
      default: function() {
        this.x = d3.scaleBand()
            .range([this.margin.left, this.width - this.margin.right])
            .domain(["Gap1_Prog", "Gap2_Prog", "Gap3_Prog", "Gap4_Prog", "Gap5_Prog", "Gap6_Succ"])
            .paddingInner(1)
            .paddingOuter(.5);

        this.y = d3
            .scaleLinear()
            .nice()
            .range([this.height - this.margin.bottom, this.margin.top])
            .domain([0, 1])

        this.xAxis = d3
            .axisBottom(this.x);

        this.yAxis = d3
            .axisLeft(this.y)
            .ticks(8)
            .tickFormat(d3.format(".1%"));

        this.svg
            .append("g")
            .attr("class", "xAxis")
            .attr("transform", `translate(0,${this.height - this.margin.bottom})`);

        this.svg
            .append("g")
            .attr("class", "yAxis")
            .attr("transform", `translate(${this.margin.left},0)`);

        this.svg
            .append("text")
            .attr("class", "xLab")
            .attr(
                "transform",
                `translate(${(this.width + this.margin.left) / 2},${this.height})`
            )
            .attr("dy", "-0.9em")
            .style("text-anchor", "middle")
            .text("Stage");

        this.svg
            .append("text")
            .attr("class", "yLab")
            .attr("transform", "rotate(-90)")
            .attr("y", 0)
            .attr("x", -(this.height / 2) + this.margin.top)
            .attr("dy", "0.9em")
            .style("text-anchor", "middle")
            .text(this.ylab);
      }
    },
    updateChart: {
      type: Function,
      default: function() {
        this.svg
            .select("g.xAxis")
            .transition()
            .duration(100)
            .call(this.xAxis)
            .selectAll("text")
            .attr("y", 10)
            .attr("x", 9)
            .attr("dy", ".35em")
            .attr("transform", "rotate(45)")
            .style("text-anchor", "start");

        this.svg
            .select("g.yAxis")
            .transition()
            .duration(100)
            .call(this.yAxis);

        const line = d3.line()
            .x(d => this.x(d.Year))
            .y(d => this.y(d[ind]));

        this.svg
            .selectAll("g.point")
            .data(this.chartData)
            .join(
                enter => {
                  enter
                      .append("g")
                      .attr("class", "point")
                      .call(g => {
                        g.append("circle")
                            .attr("cy", d => this.y(d.M))
                            .attr("cx", d => this.x(d.Index))
                            .attr("r", this.width / 150)
                            .attr("fill", "green");

                        g.append("line")
                            .attr("y1", d => Math.max(0, this.y(d.L)))
                            .attr("y2", d => Math.max(0, this.y(d.U)))
                            .attr("x1", d => this.x(d.Index))
                            .attr("x2", d => this.x(d.Index))
                            .style("stroke", "green");
                      });
                },
                update => {
                  update.call(g => {
                    g.select("circle")
                        .attr("cx", d => this.x(d.Index))
                        .transition()
                        .duration(300)
                        .attr("cy", d => this.y(d.M))
                        .attr("fill", "green");

                    g.select("line")
                        .attr("x1", d => this.x(d.Index))
                        .attr("x2", d => this.x(d.Index))
                        .transition()
                        .duration(300)
                        .attr("y1", d => this.y(d.L))
                        .attr("y2", d => this.y(d.U))
                        .style("stroke", "green");
                  });
                },
                exit => {
                  exit.transition(100).remove();
                }
            );
      }
    }
  }
}
</script>

<style>

</style>
