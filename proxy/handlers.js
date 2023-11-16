const
      db = require('./db');

module.exports = {
	putRating: function(course, rating, userId) {
        return db.updateRating(course, userId, rating);
	},
    restoreRating: function(course, userId) {
        let result = db.getUserExpAndStreak(course, userId);
        return {exp: result.exp, streak: 0}
    },
	getRating: function(course, top, delta, user) {
		let ratingCnt = 0;
		if (!user) {
			return new Promise((resolve, reject) => {
				db.countUsersInTop(course, delta).then(r => {
					ratingCnt = r.count;
					return db.getTopForCourseFromCache(course, 0, top, delta);
				})
				.then(result => {
					result.forEach((e, i, a) => { e.rank = i + 1; });
					resolve({count: ratingCnt, users: result});
				}).catch(err => reject(err));
			});
		} else {
			let rating = [];
			let offset = -1;
			return new Promise((resolve, reject) => {
				db.countUsersInTop(course, delta).then(r => {
					ratingCnt = r.count;
					return db.getTopForCourseFromCache(course, 0, top, delta);
				})
				.then(result => {
					result.forEach((e, i, a) => { e.rank = i + 1; });

					rating = result;

					let contains = rating.some(item => { return item.user == user; });

					if (contains) {
						resolve({count: ratingCnt, users: rating});
						return;
					} else {
						return db.getUserExpAndRank(course, user, delta);
					}
				})
				.then(res => {
					if (res != undefined && res.rank != undefined && res.exp != undefined) {
						offset = res.rank == top + 1 ? res.rank - 1 : res.rank - 2;
						let count = res.rank == top + 1 ? 2 : 3;
						return db.getTopForCourseFromCache(course, offset + 1, count, delta);
					} else {
						resolve({count: ratingCnt, users: rating});
						return;
					}
				})
				.then(res => {
					if (res != undefined) {
						res.forEach((e, i, a) => { e.rank = offset + i + 1; });
						rating = rating.concat(res);
					}
					resolve({count: ratingCnt, users: rating});
				})
				.catch(err => reject(err));
			});
		}
	}
};
