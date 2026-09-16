import { OrganonComplaintMatrix, OrganonComplaintRelation } from './organonAiService';

export interface QuestionHistoryItem {
  step: number;
  question: string;
  answer: string;
  target_complaint_id?: string;
  extracted_updates?: string;
}

export interface OrganonQuestionEngineState {
  complaint_matrices: OrganonComplaintMatrix[];
  complaint_relations: OrganonComplaintRelation[];
  question_history: QuestionHistoryItem[];
  next_question: {
    question_id: string;
    text: string;
    target_complaint_id?: string;
    target_field?: string;
    reason: string;
  } | null;
  is_finished: boolean;
  summary: string;
}

export async function initDynamicQuestions(
  rawText: string,
  initialMatrices: OrganonComplaintMatrix[],
  initialRelations: OrganonComplaintRelation[]
): Promise<OrganonQuestionEngineState> {
  const res = await fetch('/api/organon/next-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rawText,
      currentMatrices: initialMatrices,
      currentRelations: initialRelations,
      questionHistory: [],
      latestAnswer: null,
      currentQuestion: null
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to initialize dynamic question engine: ${err}`);
  }
  const data = await res.json();
  return {
    complaint_matrices: data.updatedMatrices || initialMatrices,
    complaint_relations: data.updatedRelations || initialRelations,
    question_history: [],
    next_question: data.nextQuestion || null,
    is_finished: data.isFinished || false,
    summary: data.summary || ''
  };
}

export async function submitAnswerAndGetNext(
  rawText: string,
  currentMatrices: OrganonComplaintMatrix[],
  currentRelations: OrganonComplaintRelation[],
  questionHistory: QuestionHistoryItem[],
  latestAnswer: string,
  currentQuestionText: string
): Promise<OrganonQuestionEngineState> {
  const res = await fetch('/api/organon/next-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rawText,
      currentMatrices,
      currentRelations,
      questionHistory,
      latestAnswer,
      currentQuestion: currentQuestionText
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to process answer in question engine: ${err}`);
  }
  const data = await res.json();
  const newHistoryItem: QuestionHistoryItem = {
    step: questionHistory.length + 1,
    question: currentQuestionText,
    answer: latestAnswer,
    extracted_updates: data.summary || 'Matrix aktualisiert'
  };

  return {
    complaint_matrices: data.updatedMatrices || currentMatrices,
    complaint_relations: data.updatedRelations || currentRelations,
    question_history: [...questionHistory, newHistoryItem],
    next_question: data.nextQuestion || null,
    is_finished: data.isFinished || false,
    summary: data.summary || ''
  };
}
