<script>
import D3Card from "./D3Card.vue";
import * as d3 from "d3";


export default {
  name: "TsplotCard",
  extends: D3Card,
  props: {
    margin: {
      type: Object,
      default: () => {
        return { top: 10, right: 30, bottom: 100, left: 80 };
      }
    },
    chartData: {
      type: Object,
      default: function() {
        return {
          Data: [
            { Year: 2010, M: 0.01, L: 0.005, U: 0.015},
            { Year: 2020, M: 0.03, L: 0.025, U: 0.035 }
          ],
          Sims: []
        }
      }
    },
    value_format: {
      type: [String, Function],
      default: ".5f"
    },
    ylab: {
      type: String,
      default: "Number"
    },
    drawChart: {
      type: Function,
      default: function() {
        this.x = d3
            .scaleLinear()
            .rangeRound([this.margin.left, this.width - this.margin.right]);

        this.y = d3
            .scaleLinear()
            .nice()
            .range([this.height - this.margin.bottom, this.margin.top]);

        this.xAxis = d3
            .axisBottom(this.x)
            .tickFormat(d3.format(".0f"));

        const fmt = (this.value_format instanceof String)?d3.format(this.value_format):this.value_format;

        this.yAxis = d3
            .axisLeft(this.y)
            .ticks(8)
            .tickFormat(fmt);

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
            .text("Year");

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

        if (this.chartData.Data.length <= 0 && this.chartData.Sims.length <= 0) return;

        // const parseTime = d3.timeParse("%Y");
        // console.log(parseTime("2020"))
        // let mx = d3.max(this.chartData, d => parseTime(d.Year));
        // let mn = d3.min(this.chartData, d => parseTime(d.Year));
        // console.log(mx)
        this.x.domain([2010, 2025]);

        console.log(this.x.domain());

        this.y.domain([
          0,
          1.1 *
          d3.max(
              this.chartData.Data.filter(ent => ent.U !== undefined),
              ent => ent.U
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
            .data(this.chartData.Data)
            .join(
                enter => {
                  enter
                      .append("g")
                      .attr("class", "point")
                      .call(g => {
                        g.append("circle")
                            .attr("cy", d => this.y(d.M))
                            .attr("cx", d => this.x(d.Year))
                            .attr("r", this.width / 150)
                            .attr("fill", d => (d.Sign === "+" ? "red" : "green"));

                        g.append("line")
                            .attr("y1", d => Math.max(0, this.y(d.L)))
                            .attr("y2", d => Math.max(0, this.y(d.U)))
                            .attr("x1", d => this.x(d.Year))
                            .attr("x2", d => this.x(d.Year))
                            .style("stroke", d => (d.Sign === "+" ? "red" : "green"));
                      });
                },
                update => {
                  update.call(g => {
                    g.select("circle")
                        .attr("cx", d => this.x(d.Year))
                        .transition()
                        .duration(300)
                        .attr("cy", d => this.y(d.M))
                        .attr("fill", d => (d.Sign === "+" ? "red" : "green"));

                    g.select("line")
                        .attr("x1", d => this.x(d.Year))
                        .attr("x2", d => this.x(d.Year))
                        .transition()
                        .duration(300)
                        .attr("y1", d => Math.max(0, this.y(d.L)))
                        .attr("y2", d => this.y(d.U))
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
}
</script>

<style>

</style>
