import { Button } from '@/components/ui/button'
import useAuth from '@/hooks/UseAuth';
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner';

const Logout = () => {
    const navigate = useNavigate();
  const {logout} = useAuth();


  const handleLogout =() =>{
    logout();
    navigate("/login");
    toast.success("User logout successfully")
  }
  return (
    <div  onClick={handleLogout} className='flex justify-center py-70'>

    <Button>
    <Link to="/login">Logout</Link>
    </Button>
    </div>
  )
}

export default Logout