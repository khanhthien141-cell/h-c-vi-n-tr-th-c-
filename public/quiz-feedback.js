export function quizFeedback(result,selected){
 if(result.error)return{state:'error',text:result.error};
 // Transport success is separate from correctness. Older servers use `ok`.
 const right=typeof result.isCorrect==='boolean'?result.isCorrect:result.ok===true;
 const correct=typeof result.correctAnswer==='boolean'?result.correctAnswer:result.correct;
 if(typeof correct!=='boolean'||typeof selected!=='boolean')return{state:'error',text:'Chưa nhận được kết quả hợp lệ. Hãy kiểm tra kết nối.'};
 const picked=selected?'Đúng':'Sai',key=correct?'Đúng':'Sai';
 return{state:right?'correct':'wrong',text:right?`✓ Bạn trả lời đúng! +${result.points} điểm · Đã mở chiêu cuối\nBạn chọn: ${picked} · Đáp án: ${key}`:`✕ Bạn trả lời sai · +0 điểm\nBạn chọn: ${picked} · Đáp án: ${key}`};
}
