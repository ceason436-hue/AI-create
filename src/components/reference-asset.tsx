/** Keeps the complete selected artwork visible without exposing neighbouring
 * pixels from its source atlas, even when its responsive frame changes ratio. */
export function ReferenceAsset({src,sourceWidth,box,alt,className=""}:{src:string;sourceWidth:number;box:string;alt:string;className?:string}) {
  const [x,y,width,height]=box.split(" ").map(Number);
  return <svg className={className} viewBox={box} preserveAspectRatio="xMidYMid meet" overflow="hidden" role="img" aria-label={alt}><svg x={x} y={y} width={width} height={height} style={{width,height}} viewBox={box} overflow="hidden"><image href={src} width={sourceWidth}/></svg></svg>;
}
