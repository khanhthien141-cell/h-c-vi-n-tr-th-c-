import {award} from './engine.js';

export function publicQuiz(q){return q?{index:q.index,text:q.text,reason:q.reason,level:q.level,at:q.at}:null;}
export function queueQuiz(p,reason){p.quizTriggers??=[];if(reason==='death')p.quizTriggers.unshift({reason});else p.quizTriggers.push({reason,level:p.level});}

// Called after each combat tick. No clock-based question scheduling.
export function pumpQuizzes(m,bank,onQuestion=()=>{}){
 for(const p of m.players){
  p.quizTriggers??=[];p.quizUsed??=[];p.quizSequence??=Math.max(-1,...Object.keys(p.answered||{}).map(Number).filter(Number.isFinite))+1;
  // A question already open at the moment of death also becomes the death question.
  // This avoids stacking two dialogs during the same ten-second respawn window.
  if(p.quiz&&!p.quiz.resolved&&p.quizTriggers[0]?.reason==='death'){
   p.quizTriggers.shift();p.quiz.reason=p.quiz.reason==='levelup'?'death+levelup':'death';p.quiz.at=m.time;onQuestion(p,publicQuiz(p.quiz));
  }
  if(p.quiz&&!p.quiz.resolved&&m.time-p.quiz.at>=10){p.answered[p.quiz.index]=null;p.quiz.resolved=true;p.quiz.closedAt=m.time;}
  if(p.quiz?.resolved&&(m.time-p.quiz.closedAt>=2||p.quizTriggers[0]?.reason==='death'))p.quiz=null;
  if(p.quiz||!p.quizTriggers.length||!bank.length)continue;
  let available=bank.filter(q=>!p.quizUsed.includes(q.id));
  // A finite bank cycles only after this player has seen its entire set.
  if(!available.length){p.quizUsed=[];available=bank;}
  const q=available[Math.floor(Math.random()*available.length)],trigger=p.quizTriggers.shift();
  p.quizUsed.push(q.id);p.quiz={index:p.quizSequence++,questionId:q.id,text:q.text,answer:q.answer,reason:trigger.reason,level:trigger.level??p.level,at:m.time,resolved:false};
  onQuestion(p,publicQuiz(p.quiz));
 }
}

export function answerQuiz(m,p,index,value){
 const q=p?.quiz;
 if(!q||q.resolved||q.index!==index||typeof value!=='boolean'||m.time-q.at>=10)return null;
 const result=award(m,p,q.index,value,q.answer,m.time-q.at);
 if(result){q.resolved=true;q.closedAt=m.time;}
 return result;
}
