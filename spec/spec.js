var grader = require('./../grader.js');


describe('#grade()', function(){
 it('takes a test score and returns the equivalent letter grade.', function() {
   expect(grader.grade(98)).toEqual('A+');
   expect(grader.grade(100)).toEqual('A+');
   expect(grader.grade(89)).toEqual('B+');
   expect(grader.grade(75)).toEqual('C');
   expect(grader.grade(72)).toEqual('C-');
   expect(grader.grade(59)).toEqual('F');
   expect(grader.grade(0)).toEqual('F');
 });
});
