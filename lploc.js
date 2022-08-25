/* This library is released under the MIT license, see https://github.com/nenadmarkus/picojs */

export const unpack_localizer = function(bytes)
{
	//
	const dview = new DataView(new ArrayBuffer(4));
	let p = 0;
	/*
		read the number of stages, scale multiplier (applied after each stage),
		number of trees per stage and depth of each tree
	*/
	dview.setUint8(0, bytes[p+0]), dview.setUint8(1, bytes[p+1]), dview.setUint8(2, bytes[p+2]), dview.setUint8(3, bytes[p+3]);
	const nstages = dview.getInt32(0, true);
	p = p + 4;
	dview.setUint8(0, bytes[p+0]), dview.setUint8(1, bytes[p+1]), dview.setUint8(2, bytes[p+2]), dview.setUint8(3, bytes[p+3]);
	const scalemul = dview.getFloat32(0, true);
	p = p + 4;
	dview.setUint8(0, bytes[p+0]), dview.setUint8(1, bytes[p+1]), dview.setUint8(2, bytes[p+2]), dview.setUint8(3, bytes[p+3]);
	const ntreesperstage = dview.getInt32(0, true);
	p = p + 4;
	dview.setUint8(0, bytes[p+0]), dview.setUint8(1, bytes[p+1]), dview.setUint8(2, bytes[p+2]), dview.setUint8(3, bytes[p+3]);
	const tdepth = dview.getInt32(0, true);
	p = p + 4;
	/*
		unpack the trees
	*/
	const tcodes_ls = [];
	const tpreds_ls = [];
	for(let i=0; i<nstages; ++i)
	{
		// read the trees for this stage
		for(let j=0; j<ntreesperstage; ++j)
		{
			// binary tests (we can read all of them at once)
			Array.prototype.push.apply(tcodes_ls, bytes.slice(p, p+4*Math.pow(2, tdepth)-4));
			p = p + 4*Math.pow(2, tdepth)-4;
			// read the prediction in the leaf nodes of the tree
			for(let k=0; k<Math.pow(2, tdepth); ++k)
				for(let l=0; l<2; ++l)
				{
					dview.setUint8(0, bytes[p+0]), dview.setUint8(1, bytes[p+1]), dview.setUint8(2, bytes[p+2]), dview.setUint8(3, bytes[p+3]);
					tpreds_ls.push(dview.getFloat32(0, true));
					p = p + 4;
				}
		}
	}
	const tcodes = new Int8Array(tcodes_ls);
	const tpreds = new Float32Array(tpreds_ls);
	/*
		construct the location estimaton function
	*/
	function loc_fun(r, c, s, pixels, nrows, ncols, ldim)
	{
		let root = 0;
		const pow2tdepth = Math.pow(2, tdepth) >> 0; // '>>0' transforms this number to int

		for(let i=0; i<nstages; ++i)
		{
			let dr=0.0, dc=0.0;

			for(let j=0; j<ntreesperstage; ++j)
			{
				let idx = 0;
				for(var k=0; k<tdepth; ++k)
				{
					const r1 = Math.min(nrows-1, Math.max(0, (256*r+tcodes[root + 4*idx + 0]*s)>>8));
					const c1 = Math.min(ncols-1, Math.max(0, (256*c+tcodes[root + 4*idx + 1]*s)>>8));
					const r2 = Math.min(nrows-1, Math.max(0, (256*r+tcodes[root + 4*idx + 2]*s)>>8));
					const c2 = Math.min(ncols-1, Math.max(0, (256*c+tcodes[root + 4*idx + 3]*s)>>8));

					idx = 2*idx + 1 + (pixels[r1*ldim+c1] > pixels[r2*ldim+c2])
				}

				const lutidx = 2*(ntreesperstage*pow2tdepth*i + pow2tdepth*j + idx - (pow2tdepth - 1))
				dr += tpreds[lutidx + 0];
				dc += tpreds[lutidx + 1];

				root += 4*pow2tdepth - 4;
			}

			r = r + dr*s;
			c = c + dc*s;

			s = s*scalemul;
		}

		return [r, c];
	}
	/*
		this function applies random perturbations to the default rectangle (r, c, s)
	*/
	function loc_fun_with_perturbs(r, c, s, nperturbs, image)
	{
		const rows=[], cols=[];

		for(let i=0; i<nperturbs; ++i)
		{
			const _s = s*(0.925 + 0.15*Math.random());
			let _r = r + s*0.15*(0.5 - Math.random());
			let _c = c + s*0.15*(0.5 - Math.random());

			[_r, _c] = loc_fun(_r, _c, _s, image.pixels, image.nrows, image.ncols, image.ldim)

			rows.push(_r)
			cols.push(_c)
		}

		// return the median along each axis
		rows.sort()
		cols.sort()

		return [rows[Math.round(nperturbs/2)], cols[Math.round(nperturbs/2)]];
	}
	/*
		we're done
	*/
	return loc_fun_with_perturbs;
}
