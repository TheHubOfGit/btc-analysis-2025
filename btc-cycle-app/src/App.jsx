import React, { useEffect, useState } from 'react';
import Hero from './components/Hero';
import StatsCard from './components/StatsCard';
import CycleChart from './components/CycleChart';
import { ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/btc_data.json')
      .then(res => res.json())
      .then(jsonData => {
        setData(jsonData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-neon-green">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-green"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-red-500 mt-20">Failed to load data.</div>;
  }

  // Extract key metrics
  const { forecast } = data;
  const nextLow = forecast.low_2026;
  const nextHigh = forecast.high_2029;

  // Calculate days until next low
  const today = new Date();
  const lowDate = new Date(nextLow.date);
  const daysToLow = Math.ceil((lowDate - today) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen pb-20">
      <Hero nextEvent={`${daysToLow} Days to Cycle Low`} />

      <main className="container mx-auto px-4 w-full space-y-12">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Projected Low (2026)"
            value={`$${nextLow.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            date={nextLow.date}
            type="danger"
            delay={0.2}
          />
          <StatsCard
            title="Projected High (2029)"
            value={`$${nextHigh.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            date={nextHigh.date}
            type="success"
            delay={0.4}
          />
          <StatsCard
            title="Current Cycle Status"
            value="Bearish Trend"
            date="Approaching Low"
            type="neutral"
            delay={0.6}
          />
        </div>

        {/* Chart Section */}
        <section>
          <CycleChart
            data={data.history}
            cycles={data.cycles}
            forecast={data.forecast}
          />
        </section>

        {/* Analysis Text */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Clock className="text-neon-purple" />
              Temporal Pattern Analysis
            </h2>
            <div className="space-y-4 text-gray-400 leading-relaxed text-sm">
              <p>
                Our proprietary algorithm identifies a high-confidence temporal symmetry in Bitcoin's market structure. Specifically, we track the <strong>1064/364 Day Cycle</strong>:
              </p>
              <ul className="space-y-3 mt-2">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-green mt-2"></div>
                  <span>
                    <strong>Accumulation Phase (1064 Days):</strong> Historically, the period from a Cycle Low to the subsequent All-Time High (ATH) spans approximately 1064 days. This phase captures the post-halving supply shock.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-red mt-2"></div>
                  <span>
                    <strong>Correction Phase (364 Days):</strong> Following a cycle peak, the market typically undergoes a mean-reversion event lasting exactly 52 weeks (364 days) to find the next macro bottom.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <ArrowUpRight className="text-neon-green" />
              Price Prediction Methodology
            </h2>
            <div className="space-y-4 text-gray-400 leading-relaxed text-sm">
              <p>
                Price targets are derived using a multi-factor model combining <strong>Historical Drawdown Averages</strong> and <strong>Ratio Decay Analysis</strong>.
              </p>
              <div className="space-y-4 mt-4">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <h4 className="text-neon-red font-bold mb-1">2026 Cycle Low Target</h4>
                  <p>
                    Calculated using a dynamic <strong>High/Low Ratio of ~4.27</strong>. This ratio accounts for volatility dampening observed in Cycles 2, 3, and 4 (decaying from 6.02 to 4.28). This suggests a higher support floor than a simple percentage drawdown would predict.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <h4 className="text-neon-green font-bold mb-1">2029 Cycle High Target</h4>
                  <p>
                    Projected using a conservative <strong>3.5x Multiplier</strong> from the 2026 Low. This adheres to the Law of Diminishing Returns, adjusting down from the 8x multiplier seen in the previous cycle to provide a realistic upper bound.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

export default App;
