<script>
import D3Card from "./D3Card.vue";
import * as d3 from "d3";

export default {
  name: "Trajectory",
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
          { Year: "2010", M: 0.01},
          { Year: "2020", M: 0.03 }
        ];
      }
    },
    value_format: {
      type: String,
      default: ".3f"
    },
    drawChart: {
      type: Function,
      default: function() {
        this.x = d3
            .scaleTime()
            .rangeRound([this.margin.left, this.width - this.margin.right]);

        this.y = d3
            .scaleLinear()
            .nice()
            .range([this.height - this.margin.bottom, this.margin.top]);

        this.xAxis = d3
            .axisBottom(this.x)
            .tickFormat(d3.timeFormat("%y"));

        this.yAxis = d3
            .axisLeft(this.y)
            .ticks(8)
            .tickFormat(d3.format(this.value_format));

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
            .text("Date");

        this.svg
            .append("text")
            .attr("class", "yLab")
            .attr("transform", "rotate(-90)")
            .attr("y", 0)
            .attr("x", -(this.height / 2) + this.margin.top)
            .attr("dy", "0.9em")
            .style("text-anchor", "middle")
            .text("Number");
      }
    },
    updateChart: {
      type: Function,
      default: function() {

        if (this.chartData.length <= 0) return;

        const parseTime = d3.timeParse("%Y-%m-%d");
        let mx = d3.max(this.chartData, d => parseTime(d.Date));
        let mn = d3.min(this.chartData, d => parseTime(d.Date));
        mn.setTime(mx.getTime() - (30 - 0.01) * 86400000);
        this.x.domain([mn, mx]);

        this.y.domain([
          0,
          1.1 *
          d3.max(
              this.chartData.filter(ent => ent.Value !== undefined),
              ent => Math.max(ent.Value.upper, ent.Value.mean)
          )
        ]);

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

        this.svg
            .selectAll("g.point")
            .data(this.chartData.filter(d => parseTime(d.Date) > mn))
            .join(
                enter => {
                  enter
                      .append("g")
                      .attr("class", "point")
                      .call(g => {
                        g.append("circle")
                            .attr("cy", d => this.y(d.Value.mean))
                            .attr("cx", d => this.x(parseTime(d.Date)))
                            .attr("r", this.width / 150)
                            .attr("fill", d => (d.Sign === "+" ? "red" : "green"));

                        g.append("line")
                            .attr("y1", d => Math.max(0, this.y(d.Value.lower)))
                            .attr("y2", d => Math.max(0, this.y(d.Value.upper)))
                            .attr("x1", d => this.x(parseTime(d.Date)))
                            .attr("x2", d => this.x(parseTime(d.Date)))
                            .style("stroke", d => (d.Sign === "+" ? "red" : "green"));
                      });
                },
                update => {
                  update.call(g => {
                    g.select("circle")
                        .attr("cx", d => this.x(parseTime(d.Date)))
                        .transition()
                        .duration(300)
                        .attr("cy", d => this.y(d.Value.mean))
                        .attr("fill", d => (d.Sign === "+" ? "red" : "green"));

                    g.select("line")
                        .attr("x1", d => this.x(parseTime(d.Date)))
                        .attr("x2", d => this.x(parseTime(d.Date)))
                        .transition()
                        .duration(300)
                        .attr("y1", d => Math.max(0, this.y(d.Value.lower)))
                        .attr("y2", d => this.y(d.Value.upper))
                        .style("stroke", d => (d.Sign === "+" ? "red" : "green"));
                  });
                },
                exit => {
                  exit.transition(100).remove();
                }
            );
      }
    }
  }
};
</script>

<style scoped>

</style>
