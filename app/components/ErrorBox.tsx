
interface ErrorProps {
  errorMessage: string;
}


const ErrorBox: React.FC<ErrorProps> = ({ errorMessage }) => {
  return (
    <div className={"h-65 w-72 bg-red-300 right-0 rounded m-3 p-3  fixed"}>
      <h4 className={"text-md text-red-500 font-bold"}>Error!</h4>
      <h6 className={"text-sm text-red-500"}>{errorMessage}</h6>
    </div>
  )
}
export default ErrorBox;