import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { getApiConfig, saveApiConfig } from '../services/api';

export default function SettingsModal({ isOpen, onClose, onConfigSaved }) {
  const currentConfig = getApiConfig();
  const [apiFootballKey, setApiFootballKey] = useState(currentConfig.apiFootballKey || '');
  const [theOddsApiKey, setTheOddsApiKey] = useState(currentConfig.theOddsApiKey || '');
  const [geminiApiKey, setGeminiApiKey] = useState(currentConfig.geminiApiKey || '');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    saveApiConfig({
      apiFootballKey,
      theOddsApiKey,
      geminiApiKey
    });
    if (onConfigSaved) onConfigSaved();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Cấu hình API Thể thao</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label" htmlFor="api-football">
              API-Football Key (RapidAPI)
            </label>
            <input
              type="text"
              id="api-football"
              className="form-input"
              placeholder="Nhập API Key để lấy tỷ số thực tế..."
              value={apiFootballKey}
              onChange={(e) => setApiFootballKey(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="the-odds">
              The Odds API Key (oddsapi)
            </label>
            <input
              type="text"
              id="the-odds"
              className="form-input"
              placeholder="Nhập API Key để lấy tỷ lệ kèo thực tế..."
              value={theOddsApiKey}
              onChange={(e) => setTheOddsApiKey(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="gemini-key">
              Gemini API Key (Dành cho AI Nhận định & MXH)
            </label>
            <input
              type="password"
              id="gemini-key"
              className="form-input"
              placeholder="Nhập Gemini API Key (mặc định đã được tích hợp)..."
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Save size={16} />
            Lưu cấu hình
          </button>
        </form>
      </div>
    </div>
  );
}
