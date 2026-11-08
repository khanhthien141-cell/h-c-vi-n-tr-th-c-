import {customization} from './customization.js';
const defaults = [
 {id:'sol',name:'Sol',title:'Thủ lĩnh ánh dương',role:'Đấu sĩ',color:'#ffc66f',hp:135,damage:16,speed:7,icon:'☀',skill:'Hỏa kích',second:'Khiên bình minh'},
 {id:'luna',name:'Luna',title:'Pháp sư nguyệt quang',role:'Pháp sư',color:'#bc9bff',hp:95,damage:22,speed:6.5,icon:'☾',skill:'Cầu nguyệt quang',second:'Sóng tinh tú'},
 {id:'ivy',name:'Ivy',title:'Người giữ khu vườn',role:'Hỗ trợ',color:'#83e6b9',hp:110,damage:12,speed:7,icon:'❋',skill:'Dây leo',second:'Hồi phục'},
 {id:'kai',name:'Kai',title:'Lưỡi kiếm thủy triều',role:'Xạ thủ',color:'#8bdbff',hp:100,damage:19,speed:8,icon:'◇',skill:'Thủy tiễn',second:'Lướt sóng'},
 {id:'ember',name:'Ember',title:'Vệ binh lửa',role:'Đấu sĩ',color:'#ff9a8b',hp:150,damage:14,speed:6.5,icon:'♜',skill:'Địa chấn',second:'Giáp lửa'},
 {id:'nova',name:'Nova',title:'Tinh linh thiên hà',role:'Pháp sư',color:'#d5a5ff',hp:90,damage:25,speed:6.5,icon:'✦',skill:'Sao băng',second:'Bùng nổ'},
 {id:'sage',name:'Sage',title:'Người kể chuyện rừng',role:'Hỗ trợ',color:'#b8e890',hp:115,damage:11,speed:7,icon:'♧',skill:'Rễ cổ thụ',second:'Hồi phục'},
 {id:'raven',name:'Raven',title:'Mũi tên hoàng hôn',role:'Xạ thủ',color:'#a8b7ff',hp:95,damage:21,speed:8,icon:'➶',skill:'Phi tiêu',second:'Lướt bóng'},
 {id:'atlas',name:'Atlas',title:'Hộ vệ học viện',role:'Đấu sĩ',color:'#e8c098',hp:170,damage:12,speed:6,icon:'⬡',skill:'Búa thiên thạch',second:'Giáp đá'},
 {id:'faye',name:'Faye',title:'Phù thủy thư viện',role:'Pháp sư',color:'#fface0',hp:90,damage:24,speed:7,icon:'✧',skill:'Trang sách ma thuật',second:'Sóng tri thức'},
 {id:'milo',name:'Milo',title:'Nhạc công mùa xuân',role:'Hỗ trợ',color:'#f4e299',hp:105,damage:13,speed:7.5,icon:'♫',skill:'Nốt nhạc',second:'Hồi phục'},
 {id:'zephyr',name:'Zephyr',title:'Sứ giả ngọn gió',role:'Xạ thủ',color:'#a5e6e4',hp:100,damage:18,speed:8.5,icon:'彡',skill:'Phong tiễn',second:'Lướt gió'}
];
export const heroes=defaults.map(h=>({...h,...(customization.heroes?.[h.id]||{}),id:h.id}));
export const teams=['Hỏa Phượng','Nguyệt Ảnh','Lục Diệp','Thiên Vũ'];
