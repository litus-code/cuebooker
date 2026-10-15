// Fetch the already authorized short-lived URL into a local browser download.
// A cross-origin link's download attribute alone does not force a download.
export async function downloadBookingAttachment(url:string,fileName:string){
 const response=await fetch(url,{credentials:'omit',cache:'no-store'})
 if(!response.ok)throw new Error('attachment_download_failed')
 const blob=await response.blob()
 const localUrl=URL.createObjectURL(blob)
 const link=document.createElement('a')
 link.href=localUrl
 link.download=fileName
 link.style.display='none'
 try{
  document.body.appendChild(link)
  link.click()
 }finally{
  link.remove()
  // Leave time for the browser to consume the URL before releasing its bytes.
  setTimeout(()=>URL.revokeObjectURL(localUrl),60000)
 }
}
