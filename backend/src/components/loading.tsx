import React from 'react'
import { Triangle } from 'react-loader-spinner'

function loading() {
  return (
    <div className='flex justify-center items-center h-64'>
    <Triangle
                    visible={true}
                    height="80"
                    width="80"
                    color="#525252"
                    ariaLabel="triangle-loading"
                    wrapperStyle={{}}
                    wrapperClass=""
                />
</div>
  )
}

export default loading