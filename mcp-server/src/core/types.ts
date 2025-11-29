/**
 * Core型定義
 *
 * @remarks scaffold_featureツールで生成される機能のベース型定義
 */
export interface MedicalRecord {
  mailId?: string;
  mailIdBranch?: string;
  subject?: string;
  receivedDate?: string;
  reviewer?: string;
  status?: string;
  category?: string;
  emailAddress?: string;
  advertisingMedia?: string;
  firstPreferredDate?: string;
  firstPreferredClinic?: string;
  inquiryMethod?: string;
  tag?: string;
  reviewedDate?: string;
  hasDeficiency?: string;
  deficiencyDetails?: string;
  correctionCompletedDate?: string;
  forAggregation?: string;
}
