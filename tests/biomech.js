// 関節角度の計算と、運動指導で一般的な角度の目安（angles.test.js と tune.js で共用）
const norm = a => ((a + 180) % 360 + 360) % 360 - 180;
const ang = (p, q) => Math.atan2(q[0] - p[0], q[1] - p[1]) * 180 / Math.PI;
function angles(J, s = 'N') {
  const knee = norm(ang(J['hip' + s], J['knee' + s]) - ang(J['knee' + s], J['ank' + s]));
  const elbow = norm(ang(J['elb' + s], J['hand' + s]) - ang(J['sh' + s], J['elb' + s]));
  const e = norm(ang(J.hip, J.sh) - ang(J['hip' + s], J['knee' + s])), hip = e >= 0 ? 180 - e : -(180 + e);   // 負は反り（伸展）
  const trunk = Math.abs(norm(ang(J.hip, J.sh) - 180));
  const foot = Math.abs(norm(ang(J['ank' + s], J['toe' + s]) - 90));
  return { knee, elbow, hip, trunk, foot };
}
// [お手本, ポーズ, 関節, 下限, 上限, 側（N=手前・F=奥）]
const REF = [
  ['squat', 1, 'knee', 100, 135], ['squat', 1, 'hip', 90, 135], ['squat', 1, 'trunk', 25, 50],
  ['goblet', 1, 'knee', 105, 140], ['goblet', 1, 'trunk', 15, 45],
  ['bbsquat', 1, 'knee', 100, 135], ['bbsquat', 1, 'trunk', 30, 55],
  ['chairsquat', 1, 'knee', 80, 115],
  ['wallsit', 1, 'knee', 80, 100], ['wallsit', 1, 'trunk', 0, 10],
  ['rdl', 1, 'knee', 5, 30], ['rdl', 1, 'hip', 70, 105], ['rdl', 1, 'trunk', 65, 95],
  ['deadlift', 0, 'knee', 45, 95], ['deadlift', 0, 'trunk', 40, 70], ['deadlift', 1, 'hip', -10, 10],
  ['split', 1, 'knee', 75, 105], ['split', 1, 'knee', 75, 115, 'F'],
  ['revlunge', 1, 'knee', 75, 105], ['bulgarian', 1, 'knee', 75, 110],
  ['pushup', 0, 'elbow', 0, 20], ['pushup', 1, 'elbow', 70, 140], ['pushup', 0, 'hip', -12, 12], ['pushup', 1, 'hip', -12, 12],
  ['kneepush', 1, 'elbow', 70, 140], ['plank', 0, 'hip', -12, 12],
  ['benchpress', 0, 'elbow', 70, 120], ['benchpress', 1, 'elbow', 0, 20],
  ['ohp', 0, 'elbow', 70, 150], ['ohp', 1, 'elbow', 0, 20],
  ['curl', 0, 'elbow', 0, 20], ['curl', 1, 'elbow', 120, 160],
  ['pullup', 0, 'elbow', 0, 20], ['pullup', 1, 'elbow', 90, 150],
  ['dbrow', 1, 'elbow', 60, 115],
  ['bridge', 1, 'hip', -15, 15], ['thrust', 1, 'hip', -15, 15], ['thrust', 1, 'knee', 70, 110],
  ['legraise', 1, 'hip', 70, 100], ['crunch', 1, 'trunk', 60, 80],
  ['calf', 1, 'foot', 25, 45], ['dbcalf', 1, 'foot', 25, 45],
  ['french', 1, 'elbow', 110, 165], ['dip', 1, 'elbow', 60, 110], ['abroll', 1, 'hip', 0, 45]
];
module.exports = { angles, REF };
