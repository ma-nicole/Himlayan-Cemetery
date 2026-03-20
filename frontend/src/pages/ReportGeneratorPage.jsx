import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';
import Layout from '../components/common/Layout';
import '../styles/AdminManagement.css';
import './ReportGeneratorPage.css';

const ReportGeneratorPage = () => {
  const [reportType, setReportType] = useState('payments');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState('');
  const [users, setUsers] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/reports/users').then(res => {
      setUsers(res.data.data || []);
    }).catch(() => {});
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    setReportData(null);
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (reportType === 'payments' && status) params.status = status;
      if (userId) params.user_id = userId;

      const res = await api.get(`/reports/${reportType}`, { params });
      setReportData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch report data.');
    } finally {
      setLoading(false);
    }
  }, [reportType, dateFrom, dateTo, status, userId]);

  const getFilterDescription = () => {
    const parts = [];
    if (dateFrom) parts.push(`From: ${dateFrom}`);
    if (dateTo) parts.push(`To: ${dateTo}`);
    if (reportType === 'payments' && status) parts.push(`Status: ${status}`);
    if (userId) {
      const user = users.find(u => String(u.id) === String(userId));
      if (user) parts.push(`User: ${user.name}`);
    }
    return parts.length > 0 ? parts.join('  |  ') : 'All Records';
  };

  const generatePDF = (action = 'download') => {
    if (!reportData) return;

    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const now = new Date();
    const dateGenerated = now.toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 71, 42);
    doc.text('Himlayan Cemetery Management System', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    const title = reportType === 'payments' ? 'Payment Report' : 'Feedback Report';
    doc.text(title, pageWidth / 2, 27, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${dateGenerated}`, pageWidth / 2, 33, { align: 'center' });
    doc.text(`Filters: ${getFilterDescription()}`, pageWidth / 2, 38, { align: 'center' });

    // Divider line
    doc.setDrawColor(26, 71, 42);
    doc.setLineWidth(0.5);
    doc.line(14, 41, pageWidth - 14, 41);

    if (reportType === 'payments') {
      const tableData = (reportData.data || []).map(p => [
        p.id,
        p.user?.name || 'N/A',
        p.type?.replace(/_/g, ' ') || '',
        `PHP ${Number(p.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
        (p.payment_method || 'N/A').toUpperCase(),
        (p.status || '').charAt(0).toUpperCase() + (p.status || '').slice(1),
        p.created_at ? new Date(p.created_at).toLocaleDateString('en-PH') : '',
        p.notes ? (p.notes.length > 80 ? p.notes.substring(0, 80) + '...' : p.notes) : '-',
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['ID', 'Member', 'Type', 'Amount', 'Method', 'Status', 'Date', 'Notes']],
        body: tableData,
        styles: { fontSize: 7.5, cellPadding: 2.5, overflow: 'linebreak' },
        headStyles: { fillColor: [26, 71, 42], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 245] },
        columnStyles: {
          0: { cellWidth: 12 },
          3: { halign: 'right', cellWidth: 28 },
          7: { cellWidth: 55 },
        },
        margin: { left: 14, right: 14 },
      });

      // Summary
      let summaryY = doc.lastAutoTable.finalY + 10;
      const pageHeight = doc.internal.pageSize.getHeight();
      if (summaryY + 25 > pageHeight - 15) {
        doc.addPage();
        summaryY = 20;
      }
      const summary = reportData.summary || {};
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 71, 42);
      doc.text('Summary', 14, summaryY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(9);
      doc.text(`Total Records: ${summary.total_count || 0}`, 14, summaryY + 6);
      doc.text(`Total Amount: PHP ${Number(summary.total_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, 14, summaryY + 12);
      doc.text(`Verified: ${summary.verified_count || 0}  |  Pending: ${summary.pending_count || 0}  |  Rejected: ${summary.rejected_count || 0}`, 14, summaryY + 18);

    } else {
      const tableData = (reportData.data || []).map(f => [
        f.id,
        f.user?.name || 'N/A',
        (f.message || '').substring(0, 80) + ((f.message || '').length > 80 ? '...' : ''),
        f.rating ? `${f.rating}/5` : 'N/A',
        (f.status || '').charAt(0).toUpperCase() + (f.status || '').slice(1),
        f.created_at ? new Date(f.created_at).toLocaleDateString('en-PH') : '',
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['ID', 'Member', 'Message', 'Rating', 'Status', 'Date']],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [26, 71, 42], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 245] },
        columnStyles: {
          0: { cellWidth: 15 },
          2: { cellWidth: 70 },
        },
        margin: { left: 14, right: 14 },
      });

      let summaryY = doc.lastAutoTable.finalY + 10;
      const pageHeight = doc.internal.pageSize.getHeight();
      if (summaryY + 25 > pageHeight - 15) {
        doc.addPage();
        summaryY = 20;
      }
      const summary = reportData.summary || {};
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 71, 42);
      doc.text('Summary', 14, summaryY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(9);
      doc.text(`Total Records: ${summary.total_count || 0}`, 14, summaryY + 6);
      doc.text(`Average Rating: ${summary.average_rating || 'N/A'}`, 14, summaryY + 12);
      doc.text(`New: ${summary.new_count || 0}  |  Read: ${summary.read_count || 0}  |  Responded: ${summary.responded_count || 0}`, 14, summaryY + 18);
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount}  |  Himlayan Cemetery Management System`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    }

    const filename = `${reportType}_report_${now.toISOString().slice(0, 10)}.pdf`;

    if (action === 'print') {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    } else {
      doc.save(filename);
    }
  };

  const paymentStatuses = ['unpaid', 'pending', 'verified', 'rejected'];

  return (
    <Layout>
      <div className="admin-management">
          <div className="page-header">
            <div className="header-content">
              <h1>Report Generator</h1>
              <p>Generate and download PDF reports for payments and feedback</p>
            </div>
          </div>

          {/* Filters Card */}
          <div className="report-filters-card">
            <h3 className="report-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              Report Filters
            </h3>

            <div className="report-filters-grid">
              <div className="filter-group">
                <label>Report Type</label>
                <select value={reportType} onChange={e => { setReportType(e.target.value); setReportData(null); setStatus(''); }}>
                  <option value="payments">Payment Report</option>
                  <option value="feedbacks">Feedback Report</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Date From</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>

              <div className="filter-group">
                <label>Date To</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>

              {reportType === 'payments' && (
                <div className="filter-group">
                  <label>Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    {paymentStatuses.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="filter-group">
                <label>Member</label>
                <select value={userId} onChange={e => setUserId(e.target.value)}>
                  <option value="">All Members</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="report-filters-actions">
              <button className="btn-generate" onClick={fetchReport} disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-sm" />
                    Generating...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </div>

          {error && <div className="report-error">{error}</div>}

          {/* Preview */}
          {reportData && (
            <div className="report-preview-card">
              <div className="report-preview-header">
                <h3 className="report-section-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  Preview — {reportType === 'payments' ? 'Payment Report' : 'Feedback Report'}
                  <span className="record-count">({reportData.data?.length || 0} records)</span>
                </h3>
                <div className="report-action-buttons">
                  <button className="btn-download" onClick={() => generatePDF('download')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download PDF
                  </button>
                  <button className="btn-print" onClick={() => generatePDF('print')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    Print
                  </button>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="report-summary-stats">
                {reportType === 'payments' ? (
                  <>
                    <div className="report-stat">
                      <span className="report-stat-label">Total Records</span>
                      <span className="report-stat-value">{reportData.summary?.total_count || 0}</span>
                    </div>
                    <div className="report-stat">
                      <span className="report-stat-label">Total Amount</span>
                      <span className="report-stat-value">PHP {Number(reportData.summary?.total_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="report-stat">
                      <span className="report-stat-label">Verified</span>
                      <span className="report-stat-value text-green">{reportData.summary?.verified_count || 0}</span>
                    </div>
                    <div className="report-stat">
                      <span className="report-stat-label">Pending</span>
                      <span className="report-stat-value text-yellow">{reportData.summary?.pending_count || 0}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="report-stat">
                      <span className="report-stat-label">Total Records</span>
                      <span className="report-stat-value">{reportData.summary?.total_count || 0}</span>
                    </div>
                    <div className="report-stat">
                      <span className="report-stat-label">Average Rating</span>
                      <span className="report-stat-value">{reportData.summary?.average_rating || 'N/A'}</span>
                    </div>
                    <div className="report-stat">
                      <span className="report-stat-label">New</span>
                      <span className="report-stat-value text-yellow">{reportData.summary?.new_count || 0}</span>
                    </div>
                    <div className="report-stat">
                      <span className="report-stat-label">Responded</span>
                      <span className="report-stat-value text-green">{reportData.summary?.responded_count || 0}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Data Table */}
              <div className="report-table-wrapper">
                <table className="report-table">
                  <thead>
                    {reportType === 'payments' ? (
                      <tr>
                        <th>ID</th>
                        <th>Member</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Notes</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>ID</th>
                        <th>Member</th>
                        <th>Message</th>
                        <th>Rating</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {reportType === 'payments' ? (
                      (reportData.data || []).map(p => (
                        <tr key={p.id}>
                          <td>{p.id}</td>
                          <td>{p.user?.name || 'N/A'}</td>
                          <td>{(p.type || '').replace(/_/g, ' ')}</td>
                          <td className="text-right">PHP {Number(p.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                          <td>{(p.payment_method || 'N/A').toUpperCase()}</td>
                          <td><span className={`status-badge status-${p.status}`}>{(p.status || '').charAt(0).toUpperCase() + (p.status || '').slice(1)}</span></td>
                          <td>{p.created_at ? new Date(p.created_at).toLocaleDateString('en-PH') : ''}</td>
                          <td className="notes-cell" title={p.notes || ''}>{p.notes ? (p.notes.length > 60 ? p.notes.substring(0, 60) + '...' : p.notes) : '-'}</td>
                        </tr>
                      ))
                    ) : (
                      (reportData.data || []).map(f => (
                        <tr key={f.id}>
                          <td>{f.id}</td>
                          <td>{f.user?.name || 'N/A'}</td>
                          <td className="message-cell">{(f.message || '').substring(0, 80)}{(f.message || '').length > 80 ? '...' : ''}</td>
                          <td>{f.rating ? `${f.rating}/5` : 'N/A'}</td>
                          <td><span className={`status-badge status-${f.status}`}>{(f.status || '').charAt(0).toUpperCase() + (f.status || '').slice(1)}</span></td>
                          <td>{f.created_at ? new Date(f.created_at).toLocaleDateString('en-PH') : ''}</td>
                        </tr>
                      ))
                    )}
                    {(reportData.data || []).length === 0 && (
                      <tr><td colSpan={reportType === 'payments' ? 8 : 7} className="empty-row">No records found for the selected filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
    </Layout>
  );
};

export default ReportGeneratorPage;
