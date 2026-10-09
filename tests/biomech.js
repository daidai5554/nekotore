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
// 四つんばいは腕（肩〜手首 約0.33×身長）が太もも（約0.25×身長）より長いので、上体は15〜20°ほど前上がりになるのが自然
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
  ['kneepush', 1, 'elbow', 70, 140], ['pushbar', 0, 'elbow', 0, 20], ['pushbar', 1, 'elbow', 85, 150], ['pushbar', 0, 'hip', -12, 12], ['pushbar', 1, 'hip', -12, 12], ['kneepushbar', 1, 'elbow', 80, 150], ['plank', 0, 'hip', -12, 12],
  ['benchpress', 0, 'elbow', 70, 120], ['benchpress', 1, 'elbow', 0, 20],
  ['ohp', 0, 'elbow', 70, 150], ['ohp', 1, 'elbow', 0, 20],
  ['curl', 0, 'elbow', 0, 20], ['curl', 1, 'elbow', 120, 160],
  ['pullup', 0, 'elbow', 0, 20], ['pullup', 1, 'elbow', 90, 150],
  ['dbrow', 1, 'elbow', 60, 115],
  ['bridge', 1, 'hip', -15, 15], ['thrust', 1, 'hip', -15, 15], ['thrust', 1, 'knee', 70, 110],
  ['legraise', 1, 'hip', 70, 100], ['crunch', 1, 'trunk', 60, 80],
  ['calf', 1, 'foot', 25, 45], ['dbcalf', 1, 'foot', 25, 45],
  ['french', 1, 'elbow', 110, 165], ['dip', 1, 'elbow', 60, 110], ['abroll', 1, 'hip', 0, 45],
  ['pistol', 1, 'knee', 100, 140], ['jumpsquat', 1, 'knee', 90, 135], ['swing', 0, 'hip', 60, 105], ['swing', 0, 'knee', 10, 45], ['swing', 1, 'hip', -10, 10],
  ['bridge1', 1, 'hip', -15, 15], ['stepup', 0, 'knee', 70, 115], ['stepup', 1, 'knee', 0, 15],
  ['inclinepush', 1, 'elbow', 70, 140], ['wallpush', 1, 'elbow', 60, 140], ['declinepush', 1, 'elbow', 70, 140], ['declinepush', 0, 'hip', -12, 12],
  ['floorpress', 0, 'elbow', 70, 110], ['bandpress', 0, 'elbow', 70, 130], ['bandpress', 1, 'elbow', 0, 20],
  ['pulldown', 1, 'elbow', 90, 155], ['bandrow', 1, 'elbow', 70, 125], ['bbrow', 1, 'elbow', 60, 115], ['bbrow', 0, 'trunk', 45, 80],
  ['kickback', 0, 'elbow', 70, 110], ['kickback', 1, 'elbow', 0, 20],
  ['deadbug', 0, 'knee', 80, 100], ['deadbug', 0, 'hip', 80, 100], ['birddog', 0, 'hip', 60, 105], ['birddog', 0, 'knee', 80, 100], ['birddog', 1, 'hip', -25, 15, 'F'],
  ['hangknee', 1, 'hip', 80, 125], ['highknee', 0, 'hip', 70, 100], ['burpee', 1, 'knee', 90, 145], ['burpee', 2, 'hip', -12, 12],
  ['mountain', 0, 'hip', 90, 135]
];
module.exports = { angles, REF };
