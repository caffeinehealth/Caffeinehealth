import React from 'react'
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'

const WeightTrendChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#d97706" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#fbbf24" />
        <XAxis dataKey="date" />
        <YAxis domain={["dataMin - 2", "dataMax + 2"]} />
        <Tooltip contentStyle={{ background: '#fffbeb', border: '2px solid #d97706', borderRadius: '8px' }} />
        <Area type="monotone" dataKey="weight" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default WeightTrendChart
