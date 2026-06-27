import { Timeline, Card, Tag, Typography } from 'antd';
const { Text } = Typography;

export default function TimelineTab({ timeline, home, away }) {
  if (!timeline || timeline.length === 0) {
    return <div style={{ textAlign: 'center', padding: '24px 0', color: '#999' }}>Trận đấu chưa diễn ra hoặc chưa có tình huống ghi nhận đặc biệt.</div>;
  }

  const items = timeline.map(event => {
    let color = 'blue';
    let icon = null;
    let label = '';
    
    if (event.type === 'GOAL') { color = 'green'; label = '⚽ Ghi bàn!'; }
    else if (event.type === 'RED') { color = 'red'; label = '🟥 Thẻ đỏ'; }
    else if (event.type === 'YELLOW') { color = 'orange'; label = '🟨 Thẻ vàng'; }
    else { color = 'gray'; label = '🔄 Thay người'; }

    return {
      color,
      children: (
        <Card size="small" style={{ width: '100%', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong style={{ marginRight: 8 }}>{event.minute}'</Text>
              <Text strong style={{ marginRight: 8 }}>{label}</Text>
              <Text type="secondary">{event.detail}</Text>
            </div>
            <Tag color={event.team === 'home' ? 'blue' : 'red'}>
              {event.team === 'home' ? home.short : away.short}
            </Tag>
          </div>
        </Card>
      )
    };
  });

  return (
    <Card>
      <Timeline items={items} />
    </Card>
  );
}
