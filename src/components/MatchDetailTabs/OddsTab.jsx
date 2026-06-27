import { Card, Row, Col, Typography, Tag, Space } from 'antd';
const { Text, Title } = Typography;

export default function OddsTab({ match, odds, activeBetId, onAddBet, evHome, evDraw, evAway, evOver, evUnder, language, t, home, away }) {
  if (!odds) return null;

  const renderBetButton = (title, oddsValue, active, onClick, ev = null) => (
    <Card 
      hoverable 
      size="small" 
      onClick={onClick}
      style={{ 
        borderColor: active ? '#1677ff' : '#f0f0f0', 
        backgroundColor: active ? '#e6f4ff' : '#ffffff',
        cursor: 'pointer' 
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong style={{ color: active ? '#1677ff' : 'inherit' }}>{title}</Text>
        <Title level={4} style={{ margin: 0, color: active ? '#1677ff' : 'inherit' }}>{oddsValue.toFixed(2)}</Title>
      </div>
      {ev > 0.02 && (
        <div style={{ marginTop: 4, textAlign: 'right' }}>
          <Tag color="orange" bordered={false}>🔥 Thơm (+{(ev * 100).toFixed(0)}% EV)</Tag>
        </div>
      )}
    </Card>
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* 1x2 Market */}
      <Card title={`${t('odds1x2')} (Châu Âu)`} size="small">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            {renderBetButton(
              home.name, 
              odds.h2h.home, 
              activeBetId === `${match.id}-1x2-home`, 
              () => onAddBet(match, `${home.name} Thắng`, odds.h2h.home, `${match.id}-1x2-home`), 
              evHome
            )}
          </Col>
          <Col xs={24} md={8}>
            {renderBetButton(
              t('drawLabel'), 
              odds.h2h.draw, 
              activeBetId === `${match.id}-1x2-draw`, 
              () => onAddBet(match, 'Hòa', odds.h2h.draw, `${match.id}-1x2-draw`), 
              evDraw
            )}
          </Col>
          <Col xs={24} md={8}>
            {renderBetButton(
              away.name, 
              odds.h2h.away, 
              activeBetId === `${match.id}-1x2-away`, 
              () => onAddBet(match, `${away.name} Thắng`, odds.h2h.away, `${match.id}-1x2-away`), 
              evAway
            )}
          </Col>
        </Row>
      </Card>

      {/* Handicap Market */}
      <Card title={`${t('oddsHandicap')} (${odds.handicap.line})`} size="small">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            {renderBetButton(
              `${home.name} (${odds.handicap.line})`, 
              odds.handicap.home, 
              activeBetId && activeBetId.split('_')[0] === `${match.id}-handicap-home`, 
              () => onAddBet(match, `Chấp ${odds.handicap.line} - ${home.name}`, odds.handicap.home, `${match.id}-handicap-home_${odds.handicap.line}`)
            )}
          </Col>
          <Col xs={24} md={12}>
            {renderBetButton(
              `${away.name} (${odds.handicap.line.startsWith('-') ? odds.handicap.line.replace('-', '+') : `-${odds.handicap.line}`})`, 
              odds.handicap.away, 
              activeBetId && activeBetId.split('_')[0] === `${match.id}-handicap-away`, 
              () => onAddBet(match, `Được chấp ${odds.handicap.line.startsWith('-') ? odds.handicap.line.replace('-', '+') : `-${odds.handicap.line}`} - ${away.name}`, odds.handicap.away, `${match.id}-handicap-away_${-parseFloat(odds.handicap.line)}`)
            )}
          </Col>
        </Row>
      </Card>

      {/* Over/Under Market */}
      <Card title={`${t('oddsOverUnder')} (${odds.overUnder.line})`} size="small">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            {renderBetButton(
              `${t('overLabel')} (${odds.overUnder.line})`, 
              odds.overUnder.over, 
              activeBetId && activeBetId.split('_')[0] === `${match.id}-ou-over`, 
              () => onAddBet(match, `${t('overLabel')} ${odds.overUnder.line}`, odds.overUnder.over, `${match.id}-ou-over_${odds.overUnder.line}`), 
              evOver
            )}
          </Col>
          <Col xs={24} md={12}>
            {renderBetButton(
              `${t('underLabel')} (${odds.overUnder.line})`, 
              odds.overUnder.under, 
              activeBetId && activeBetId.split('_')[0] === `${match.id}-ou-under`, 
              () => onAddBet(match, `${t('underLabel')} ${odds.overUnder.line}`, odds.overUnder.under, `${match.id}-ou-under_${odds.overUnder.line}`), 
              evUnder
            )}
          </Col>
        </Row>
      </Card>
    </Space>
  );
}
