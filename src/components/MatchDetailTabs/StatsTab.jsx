import { Card, Progress, Space, Typography } from 'antd';
const { Text } = Typography;

export default function StatsTab({ detailedStats, home, away }) {
  if (!detailedStats || detailedStats.length === 0) {
    return <div style={{ textAlign: 'center', padding: '24px 0', color: '#999' }}>Chưa có dữ liệu thống kê trực tiếp cho trận đấu này.</div>;
  }

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {detailedStats.map((stat) => {
          const valHome = stat.home;
          const valAway = stat.away;
          const total = valHome + valAway === 0 ? 1 : valHome + valAway;
          const pctHome = (valHome / total) * 100;
          
          let displayHome = stat.key === 'xg' ? Number(valHome).toFixed(2) : valHome;
          let displayAway = stat.key === 'xg' ? Number(valAway).toFixed(2) : valAway;

          return (
            <div key={stat.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text strong>{displayHome}</Text>
                <Text type="secondary">{stat.label}</Text>
                <Text strong>{displayAway}</Text>
              </div>
              <Progress 
                percent={pctHome} 
                showInfo={false} 
                strokeColor={home.color || '#1677ff'} 
                trailColor={away.color || '#f5222d'} 
                size="small"
              />
            </div>
          );
        })}
      </Space>
    </Card>
  );
}
